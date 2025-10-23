import { MongoClient } from "mongodb";
import mongo from "../mongo";
import getTokensFromWallet from "../functions/tokenRelated/getTokensFromWallet";
import getTokensFromTrackedWallets from "../functions/userRelated/getTokensFromTrackedWallets";

interface TokenComparison {
  symbol: string;
  name: string;
  contractAddress: string;
  chain: string;
  instances: Array<{
    walletAddress: string;
    price: number;
    priceChange24h: number;
    quantity: string;
    value: number;
    fetchTime: string;
  }>;
}

interface TestResults {
  totalTokens: number;
  duplicateTokens: TokenComparison[];
  inconsistentPriceChanges: TokenComparison[];
  inconsistentPrices: TokenComparison[];
  summary: {
    totalDuplicates: number;
    inconsistentChanges: number;
    inconsistentPrices: number;
    maxChangeVariance: number;
    maxPriceVariance: number;
  };
}

/**
 * Test script to analyze 24h change consistency across wallets and chains
 */
export default async function test24hChange(userId?: string, testWallets?: string[]): Promise<TestResults> {
  const client = mongo();
  
  try {
    let allTokens: any[] = [];
    
    if (userId) {
      // Test specific user's tracked wallets
      console.log(`🔍 Testing 24h changes for user: ${userId}`);
      allTokens = await getTokensFromTrackedWallets(userId, client);
    } else if (testWallets && testWallets.length > 0) {
      // Test specific wallets
      console.log(`🔍 Testing 24h changes for wallets: ${testWallets.join(', ')}`);
      
      for (const wallet of testWallets) {
        try {
          const tokens = await getTokensFromWallet(wallet, client);
          const tokensWithWallet = tokens.map(token => ({
            ...token,
            wallet_address: wallet,
            fetch_time: new Date().toISOString()
          }));
          allTokens.push(...tokensWithWallet);
        } catch (error) {
          console.error(`❌ Error fetching tokens for wallet ${wallet}:`, error);
        }
      }
    } else {
      // Test with sample wallets from different chains
      const sampleWallets = [
        "0x742d35Cc6634C0532925a3b8D486a8fca3b3Ee",   // Ethereum - sample wallet
        "0x8ba1f109551bD432803012645Hac136c60143", // Polygon - sample wallet  
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", // Ethereum - vitalik.eth
      ];
      
      console.log(`🔍 Testing 24h changes for sample wallets across chains`);
      
      for (const wallet of sampleWallets) {
        try {
          const tokens = await getTokensFromWallet(wallet, client);
          const tokensWithWallet = tokens.map(token => ({
            ...token,
            wallet_address: wallet,
            fetch_time: new Date().toISOString()
          }));
          allTokens.push(...tokensWithWallet);
        } catch (error) {
          console.error(`❌ Error fetching tokens for wallet ${wallet}:`, error);
        }
      }
    }

    console.log(`📊 Total tokens fetched: ${allTokens.length}`);
    
    // Analyze tokens for duplicates and inconsistencies
    const results = analyzeTokenConsistency(allTokens);
    
    // Print detailed results
    printTestResults(results);
    
    return results;
    
  } catch (error) {
    console.error("❌ Error in test24hChange:", error);
    throw error;
  } finally {
    await client.close();
  }
}

function analyzeTokenConsistency(tokens: any[]): TestResults {
  console.log("\n🔬 Analyzing token consistency...");
  
  // Group tokens by unique identifier (contract address + chain)
  const tokenGroups = new Map<string, any[]>();
  
  tokens.forEach(token => {
    const key = `${token.address}-${token.chain}`.toLowerCase();
    if (!tokenGroups.has(key)) {
      tokenGroups.set(key, []);
    }
    tokenGroups.get(key)!.push(token);
  });
  
  const duplicateTokens: TokenComparison[] = [];
  const inconsistentPriceChanges: TokenComparison[] = [];
  const inconsistentPrices: TokenComparison[] = [];
  
  let maxChangeVariance = 0;
  let maxPriceVariance = 0;
  
  // Analyze each group of duplicate tokens
  tokenGroups.forEach((group, key) => {
    if (group.length > 1) {
      const firstToken = group[0];
      
      const comparison: TokenComparison = {
        symbol: firstToken.symbol,
        name: firstToken.name,
        contractAddress: firstToken.address,
        chain: firstToken.chain,
        instances: group.map(token => ({
          walletAddress: token.wallet_address,
          price: parseFloat(token.price) || 0,
          priceChange24h: parseFloat(token.price_change_24h) || 0,
          quantity: token.quantity.toString(),
          value: parseFloat(token.value) || 0,
          fetchTime: token.fetch_time || token.updated_at || 'unknown'
        }))
      };
      
      duplicateTokens.push(comparison);
      
      // Check for price change inconsistencies
      const priceChanges = comparison.instances.map(instance => instance.priceChange24h);
      const prices = comparison.instances.map(instance => instance.price);
      
      const minChange = Math.min(...priceChanges);
      const maxChange = Math.max(...priceChanges);
      const changeVariance = Math.abs(maxChange - minChange);
      
      const minPrice = Math.min(...prices.filter(p => p > 0));
      const maxPrice = Math.max(...prices.filter(p => p > 0));
      const priceVariance = prices.length > 0 && minPrice > 0 ? 
        Math.abs((maxPrice - minPrice) / minPrice) * 100 : 0;
      
      if (changeVariance > 0.01) { // More than 1% difference
        inconsistentPriceChanges.push(comparison);
        maxChangeVariance = Math.max(maxChangeVariance, changeVariance);
      }
      
      if (priceVariance > 0.1) { // More than 0.1% price difference
        inconsistentPrices.push(comparison);
        maxPriceVariance = Math.max(maxPriceVariance, priceVariance);
      }
    }
  });
  
  return {
    totalTokens: tokens.length,
    duplicateTokens,
    inconsistentPriceChanges,
    inconsistentPrices,
    summary: {
      totalDuplicates: duplicateTokens.length,
      inconsistentChanges: inconsistentPriceChanges.length,
      inconsistentPrices: inconsistentPrices.length,
      maxChangeVariance,
      maxPriceVariance
    }
  };
}

function printTestResults(results: TestResults): void {
  console.log("\n" + "=".repeat(60));
  console.log("📋 24H CHANGE CONSISTENCY TEST RESULTS");
  console.log("=".repeat(60));
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total tokens analyzed: ${results.totalTokens}`);
  console.log(`   Duplicate tokens found: ${results.summary.totalDuplicates}`);
  console.log(`   Tokens with inconsistent 24h changes: ${results.summary.inconsistentChanges}`);
  console.log(`   Tokens with inconsistent prices: ${results.summary.inconsistentPrices}`);
  console.log(`   Max 24h change variance: ${results.summary.maxChangeVariance.toFixed(4)}%`);
  console.log(`   Max price variance: ${results.summary.maxPriceVariance.toFixed(4)}%`);
  
  if (results.inconsistentPriceChanges.length > 0) {
    console.log(`\n❌ INCONSISTENT 24H CHANGES DETECTED:`);
    results.inconsistentPriceChanges.forEach((token, index) => {
      console.log(`\n   ${index + 1}. ${token.symbol} (${token.name}) on ${token.chain}`);
      console.log(`      Contract: ${token.contractAddress}`);
      token.instances.forEach((instance, i) => {
        console.log(`      Wallet ${i + 1}: ${instance.walletAddress.substring(0, 10)}...`);
        console.log(`         Price: $${instance.price.toFixed(6)}`);
        console.log(`         24h Change: ${instance.priceChange24h.toFixed(4)}%`);
        console.log(`         Quantity: ${instance.quantity}`);
        console.log(`         Value: $${instance.value.toFixed(2)}`);
        console.log(`         Fetched: ${instance.fetchTime}`);
      });
      
      const changes = token.instances.map(i => i.priceChange24h);
      const variance = Math.abs(Math.max(...changes) - Math.min(...changes));
      console.log(`      ⚠️  Variance: ${variance.toFixed(4)}%`);
    });
  } else {
    console.log(`\n✅ NO INCONSISTENT 24H CHANGES FOUND - All duplicate tokens show consistent price changes!`);
  }
  
  if (results.inconsistentPrices.length > 0) {
    console.log(`\n❌ INCONSISTENT PRICES DETECTED:`);
    results.inconsistentPrices.forEach((token, index) => {
      console.log(`\n   ${index + 1}. ${token.symbol} (${token.name}) on ${token.chain}`);
      const prices = token.instances.map(i => i.price).filter(p => p > 0);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const variance = prices.length > 0 && minPrice > 0 ? 
        Math.abs((maxPrice - minPrice) / minPrice) * 100 : 0;
      console.log(`      ⚠️  Price variance: ${variance.toFixed(4)}%`);
      console.log(`      📈 Price range: $${minPrice.toFixed(6)} - $${maxPrice.toFixed(6)}`);
    });
  } else {
    console.log(`\n✅ NO INCONSISTENT PRICES FOUND - All duplicate tokens show consistent prices!`);
  }
  
  console.log("\n" + "=".repeat(60));
  
  if (results.summary.inconsistentChanges === 0 && results.summary.inconsistentPrices === 0) {
    console.log("🎉 TEST PASSED: All tokens show consistent data across wallets!");
  } else {
    console.log("⚠️  TEST ISSUES DETECTED: Some tokens show inconsistent data.");
    console.log("💡 Recommendations:");
    console.log("   1. Implement token consolidation in the frontend");
    console.log("   2. Add caching mechanism for price data");
    console.log("   3. Use single source of truth for token metadata");
  }
  
  console.log("=".repeat(60));
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("🚀 Running test with sample wallets...");
    test24hChange();
  } else if (args[0] === '--user' && args[1]) {
    console.log(`🚀 Running test for user: ${args[1]}`);
    test24hChange(args[1]);
  } else if (args[0] === '--wallets') {
    const wallets = args.slice(1);
    console.log(`🚀 Running test for wallets: ${wallets.join(', ')}`);
    test24hChange(undefined, wallets);
  } else {
    console.log("Usage:");
    console.log("  npm run test:24h                           # Test with sample wallets");
    console.log("  npm run test:24h --user <userId>           # Test specific user");
    console.log("  npm run test:24h --wallets <wallet1> <wallet2>  # Test specific wallets");
  }
}