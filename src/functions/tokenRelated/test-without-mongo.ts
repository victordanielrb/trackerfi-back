import filterTokens from "./filterTokens";
import axios from "axios";
import { getCoinGeckoPlatformId, getCoinGeckoTokenAddress } from "./coingeckoMapping";

// Test without MongoDB to isolate CoinGecko API
export async function testWithoutMongo() {
  try {
    console.log('🚀 Testing CoinGecko API without MongoDB...');
    
    // Mock tokens data
    const mockTokens = [
      {
        name: 'USDT0',
        symbol: 'USDT0',
        address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        chain: 'arbitrum',
        position_type: 'wallet',
        last_updated: Date.now()
      },
      {
        name: 'Ethereum',
        symbol: 'ETH',
        address: '0x0000000000000000000000000000000000000000',
        chain: 'arbitrum',
        position_type: 'wallet',
        last_updated: Date.now()
      }
    ];
    
    const filteredTokens = filterTokens(mockTokens);
    console.log('✅ Tokens filtered:', filteredTokens);
    
    // Test CoinGecko API with mapping
    const platformId = getCoinGeckoPlatformId('arbitrum');
    console.log(`✅ Mapping arbitrum → ${platformId}`);
    
    // Map addresses for CoinGecko
    const mappedAddresses = filteredTokens.arbitrum.map(token => {
      const mappedAddress = getCoinGeckoTokenAddress(token.address, 'arbitrum');
      if (mappedAddress !== token.address) {
        console.log(`🔄 Mapping native token: ${token.address} → ${mappedAddress} on arbitrum`);
      }
      return mappedAddress;
    });
    
    const addresses = mappedAddresses.join(',');
    const url = `https://api.coingecko.com/api/v3/simple/token_price/${platformId}?contract_addresses=${addresses}&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&vs_currencies=usd,brl`;
    
    console.log('🔍 Testing CoinGecko URL:', url);
    
    const response = await axios.get(url, {
      headers: { 
        'accept': 'application/json', 
        'x-cg-demo-api-key': 'CG-S9zAVgB8LWj91SZD1Umep4A9' 
      }
    });
    
    console.log('✅ CoinGecko Response:', response.data);
    
    // Apply prices to tokens using mapped addresses
    filteredTokens.arbitrum.forEach((token, index) => {
      const mappedAddress = mappedAddresses[index];
      const priceData = response.data[mappedAddress.toLowerCase()];
      if (priceData) {
        token['price'] = priceData.usd || 0;
        token['mcap'] = priceData.usd_market_cap || 0;
        token['usd_24h_volume'] = priceData.usd_24h_vol || 0;
        token['usd_24h_change'] = priceData.usd_24h_change || 0;
        
        if (mappedAddress !== token.address) {
          console.log(`💰 ${token.symbol}: $${priceData.usd} (mapped from ${token.address})`);
        } else {
          console.log(`💰 ${token.symbol}: $${priceData.usd}`);
        }
      } else {
        console.log(`⚠️ No price data found for ${token.symbol} (${token.address})`);
      }
    });
    
    console.log('✅ Tokens with prices:', filteredTokens);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testWithoutMongo();
