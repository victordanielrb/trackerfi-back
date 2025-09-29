import { env } from "process";

import { get } from "http";
import getTokensFromWallet from "./getTokensFromWallet";
import axios from "axios";
import TokensFromWallet from "../../interfaces/tokenInterface";
import { time, timeEnd } from "console";
import { stringify } from "querystring";
import mongo from "../../mongo";
import filterTokens from "./filterTokens";
import { MongoClient } from "mongodb";
import { getCoinGeckoPlatformId, isSupportedChain, getCoinGeckoTokenAddress } from "./coingeckoMapping";

export interface FilteredTokens {
  [chain: string]: TokensFromWallet[];
}

// Fallback function to get prices by symbol
async function fallbackPricesBySymbol(tokens: TokensFromWallet[]) {
  try {
    // Get unique symbols from tokens without prices
    const symbols = [...new Set(tokens.map(token => token.symbol.toLowerCase()))];
    const symbolsString = symbols.join(',');
    
    const fallbackUrl = `https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd,brl&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&symbols=${symbolsString}`;
    
    console.log(`🔍 Fallback URL:`, fallbackUrl);
    
    const fallbackResponse = await axios.get(fallbackUrl, {
      headers: { 
        'accept': 'application/json', 
        'x-cg-demo-api-key': 'CG-S9zAVgB8LWj91SZD1Umep4A9' 
      }
    });
    
    console.log(`📊 Fallback response:`, Object.keys(fallbackResponse.data));
    
    // Apply fallback prices
    tokens.forEach(token => {
      const symbolData = fallbackResponse.data[token.symbol.toLowerCase()];
      if (symbolData) {
        token['price'] = symbolData.usd || 0;
        token['mcap'] = symbolData.usd_market_cap || 0;
        token['usd_24h_volume'] = symbolData.usd_24h_vol || 0;
        token['usd_24h_change'] = symbolData.usd_24h_change || 0;
        token['last_updated'] = new Date().valueOf();
        console.log(`🔄 ${token.symbol}: $${token.price} (fallback by symbol)`);
      } else {
        console.warn(`❌ No fallback price found for ${token.symbol}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Fallback price fetch failed:', error);
  }
}

export default async function getTokenPrice(filterToken: FilteredTokens, client?: MongoClient) {
  let shouldCloseClient = false;
  
  if (!client) {
    client = mongo();
    shouldCloseClient = true;
  }
  
  try {
    for (const [chain, tokens] of Object.entries(filterToken)) {
      // Map to correct platform ID using the comprehensive mapping
      const platformId = getCoinGeckoPlatformId(chain);
      
      if (!platformId) {
        console.warn(`❌ Unsupported chain: ${chain}. Use one of: ${Object.keys(require('./coingeckoMapping').COINGECKO_PLATFORM_MAP).join(', ')}`);
        continue;
      }

      console.log(`✅ Mapping ${chain} → ${platformId}`);

      // Map native token addresses to wrapped tokens for CoinGecko
      const mappedTokens = tokens.map(token => ({
        ...token,
        coingeckoAddress: getCoinGeckoTokenAddress(token.address, chain)
      }));

      const tokenSeparatedByComma = mappedTokens.map(t => t.coingeckoAddress).join(',');

      const url = `https://api.coingecko.com/api/v3/simple/token_price/${platformId}?contract_addresses=${tokenSeparatedByComma}&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&vs_currencies=usd,brl`;
      
      console.log(`🔍 Fetching prices for ${chain} (${platformId}):`, url);

      const response = await axios.get(url, {
        headers: { 
          'accept': 'application/json', 
          'x-cg-demo-api-key': 'CG-S9zAVgB8LWj91SZD1Umep4A9' 
        }
      });

      console.log(`📊 CoinGecko response for ${chain}:`, Object.keys(response.data));

      // Apply prices using the mapped addresses
      const tokensWithoutPrices: TokensFromWallet[] = [];
      
      filterToken[chain].forEach((token, index) => {
        const mappedAddress = mappedTokens[index].coingeckoAddress;
        const priceData = response.data[mappedAddress.toLowerCase()];
        if (priceData) {
          token['price'] = priceData.usd || 0;
          token['mcap'] = priceData.usd_market_cap || 0;
          token['usd_24h_volume'] = priceData.usd_24h_vol || 0;
          token['usd_24h_change'] = priceData.usd_24h_change || 0;
          token['last_updated'] = new Date().valueOf();
          console.log(`💰 ${token.symbol}: $${token.price} ${token.address !== mappedAddress ? '(mapped from ' + token.address + ')' : ''}`);
        } else {
          console.warn(`⚠️ No price data found for ${token.symbol} (${token.address} → ${mappedAddress})`);
          tokensWithoutPrices.push(token);
        }
      });

      // Fallback: Try to get prices by symbol for tokens without prices
      if (tokensWithoutPrices.length > 0) {
        console.log(`🔄 Attempting fallback for ${tokensWithoutPrices.length} tokens using symbol-based endpoint...`);
        await fallbackPricesBySymbol(tokensWithoutPrices);
      }
    }

    const finalFilteredArray = Object.values(filterToken).flat();
    
    // Update tokens in database
    if (finalFilteredArray.length > 0) {
      const bulkOps = finalFilteredArray.map(token => ({
        updateOne: {
          filter: { address: token.address, chain: token.chain },
          update: { $set: token },
          upsert: true
        }
      }));

      await client!.db("trackerfi").collection("tokens").bulkWrite(bulkOps);
    }

    return finalFilteredArray;
    
  } catch (error) {
    console.error('❌ Error fetching token prices:', error);
    throw error;
  } finally {
    if (shouldCloseClient && client) {
      await client.close();
    }
  }
}