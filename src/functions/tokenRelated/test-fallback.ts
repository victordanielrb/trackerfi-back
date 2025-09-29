import filterTokens from "./filterTokens";
import getTokenPrice from "./setPriceTokens";

// Test the fallback mechanism with mock tokens that might not have contract addresses
export async function testFallback() {
  try {
    console.log('🚀 Testing fallback mechanism...');
    
    // Mock tokens - some with real addresses, some that will trigger fallback
    const mockTokens = [
      {
        name: 'Ethereum',
        symbol: 'ETH', 
        address: '0x0000000000000000000000000000000000000000', // Native ETH - should work with mapping
        chain: 'arbitrum',
        position_type: 'wallet',
        last_updated: Date.now()
      },
      {
        name: 'Bitcoin',
        symbol: 'BTC', // This will likely trigger fallback since no BTC on Arbitrum
        address: '0xfakeaddress1111111111111111111111111111111', 
        chain: 'arbitrum',
        position_type: 'wallet',
        last_updated: Date.now()
      },
      {
        name: 'Solana',
        symbol: 'SOL', // This will trigger fallback
        address: '0xfakeaddress2222222222222222222222222222222',
        chain: 'arbitrum', 
        position_type: 'wallet',
        last_updated: Date.now()
      },
      {
        name: 'USDT',
        symbol: 'USDT',
        address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', // Real USDT address - should work
        chain: 'arbitrum',
        position_type: 'wallet',
        last_updated: Date.now()
      }
    ];
    
    const filteredTokens = filterTokens(mockTokens);
    console.log('✅ Tokens to process:', filteredTokens);
    
    // This should trigger both primary and fallback mechanisms
    const result = await getTokenPrice(filteredTokens);
    
    console.log('✅ Final results with fallback:');
    result.forEach(token => {
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

testFallback();
