import { Request, Response } from 'express';
import { MongoClient } from 'mongodb';
import test24hChange from '../../scripts/test24hChange';

/**
 * API endpoint to test 24h change consistency
 * GET /api/test/24h-change?userId=xxx or ?wallets=wallet1,wallet2
 */
export const test24hChangeEndpoint = async (req: Request, res: Response) => {
  try {
    const { userId, wallets } = req.query;
    
    let walletsArray: string[] | undefined;
    if (wallets && typeof wallets === 'string') {
      walletsArray = wallets.split(',').map(w => w.trim());
    }
    
    console.log('🔍 Starting 24h change consistency test...');
    
    const results = await test24hChange(
      userId as string, 
      walletsArray
    );
    
    // Create response with summary and recommendations
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      testResults: {
        summary: results.summary,
        issues: {
          inconsistentPriceChanges: results.inconsistentPriceChanges.length,
          inconsistentPrices: results.inconsistentPrices.length,
          details: {
            priceChangeIssues: results.inconsistentPriceChanges.map(token => ({
              symbol: token.symbol,
              chain: token.chain,
              contractAddress: token.contractAddress,
              variance: Math.abs(
                Math.max(...token.instances.map(i => i.priceChange24h)) - 
                Math.min(...token.instances.map(i => i.priceChange24h))
              ),
              instances: token.instances.length
            })),
            priceIssues: results.inconsistentPrices.map(token => ({
              symbol: token.symbol,
              chain: token.chain,
              contractAddress: token.contractAddress,
              priceRange: {
                min: Math.min(...token.instances.map(i => i.price).filter(p => p > 0)),
                max: Math.max(...token.instances.map(i => i.price).filter(p => p > 0))
              },
              instances: token.instances.length
            }))
          }
        },
        recommendations: generateRecommendations(results)
      }
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error in 24h change test endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run 24h change test',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

function generateRecommendations(results: any): string[] {
  const recommendations: string[] = [];
  
  if (results.summary.inconsistentChanges > 0) {
    recommendations.push(
      "🔧 Implement token consolidation in frontend to show consistent 24h changes for duplicate tokens"
    );
    recommendations.push(
      "⚡ Add caching mechanism to ensure all instances of the same token use identical price data"
    );
  }
  
  if (results.summary.inconsistentPrices > 0) {
    recommendations.push(
      "💰 Standardize price fetching to use single source of truth for token prices"
    );
    recommendations.push(
      "🕒 Add timestamp validation to ensure price data freshness"
    );
  }
  
  if (results.summary.totalDuplicates > 0) {
    recommendations.push(
      "📊 Consider aggregating duplicate tokens by contract address + chain in the UI"
    );
  }
  
  if (recommendations.length === 0) {
    recommendations.push("✅ No issues found! Token data is consistent across wallets.");
  }
  
  return recommendations;
}

/**
 * Quick test function for development
 */
export const quickTest24hChange = async (): Promise<void> => {
  console.log("🚀 Quick 24h Change Test");
  console.log("========================");
  
  try {
    // Test with some known wallets that likely have common tokens
    const testWallets = [
      "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", // vitalik.eth - Ethereum
      "0x742d35Cc6634C0532925a3b8D486a871FF75aEcB",  // Another Ethereum wallet
    ];
    
    const results = await test24hChange(undefined, testWallets);
    
    if (results.summary.inconsistentChanges > 0 || results.summary.inconsistentPrices > 0) {
      console.log("\n❌ ISSUES DETECTED!");
      console.log(`   - ${results.summary.inconsistentChanges} tokens with inconsistent 24h changes`);
      console.log(`   - ${results.summary.inconsistentPrices} tokens with inconsistent prices`);
      console.log(`   - Max change variance: ${results.summary.maxChangeVariance.toFixed(4)}%`);
    } else {
      console.log("\n✅ ALL TESTS PASSED!");
      console.log("   - All duplicate tokens show consistent data");
    }
    
  } catch (error) {
    console.error("❌ Quick test failed:", error);
  }
};

export default { test24hChangeEndpoint, quickTest24hChange };