import filterTokens from "./filterTokens";
import axios from "axios";
import { getCoinGeckoPlatformId, getCoinGeckoTokenAddress } from "./coingeckoMapping";

// Fallback function to get prices by symbol (without MongoDB)
async function fallbackPricesBySymbol(tokens: any[]) {
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

// Test without MongoDB to show complete fallback flow
export async function testFallbackNoMongo() {
  try {
    console.log('🚀 Testing complete fallback mechanism (no MongoDB)...');
    
    const mockTokens = [
      {
        name: 'Ethereum',
        symbol: 'ETH', 
        address: '0x0000000000000000000000000000000000000000',
        chain: 'arbitrum',
        position_type: 'wallet',
        last_updated: Date.now()
      },
      {
        name: 'Bitcoin',
        symbol: 'BTC',
        address: '0xfakeaddress1111111111111111111111111111111', 
        chain: 'arbitrum',
        position_type: 'wallet',
        last_updated: Date.now()
      },
      {
        name: 'Solana',
        symbol: 'SOL',
        address: '0xfakeaddress2222222222222222222222222222222',
        chain: 'arbitrum', 
        position_type: 'wallet',
        last_updated: Date.now()
      },
      {
        name: 'USDT',
        symbol: 'USDT',
        address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        chain: 'arbitrum',
        position_type: 'wallet',
        last_updated: Date.now()
      }
    ];
    
    const filteredTokens = filterTokens(mockTokens);
    console.log('✅ Tokens to process:', filteredTokens);
    
    // Process like setPriceTokens but without MongoDB
    for (const [chain, tokens] of Object.entries(filteredTokens)) {
      const platformId = getCoinGeckoPlatformId(chain);
      console.log(`✅ Mapping ${chain} → ${platformId}`);

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

      const tokensWithoutPrices: any[] = [];
      
      filteredTokens[chain].forEach((token, index) => {
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

      if (tokensWithoutPrices.length > 0) {
        console.log(`🔄 Attempting fallback for ${tokensWithoutPrices.length} tokens using symbol-based endpoint...`);
        await fallbackPricesBySymbol(tokensWithoutPrices);
      }
    }

    const finalResults = Object.values(filteredTokens).flat();
    
    console.log('\n🎯 FINAL RESULTS:');
    finalResults.forEach(token => {
      if (token.price && token.price > 0) {
        console.log(`💰 ${token.symbol}: $${token.price} ✅`);
      } else {
        console.log(`❌ ${token.symbol}: No price found`);
      }
    });
    
  } catch (error) {
    console.error('❌ Fallback test error:', error);
  }
}

testFallbackNoMongo();
