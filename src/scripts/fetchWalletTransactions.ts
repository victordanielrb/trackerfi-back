import 'dotenv/config';
import { withMongoDB } from '../mongo';
import { getUserTransactions } from '../functions/userRelated/getUserTransactions';
import { ObjectId } from 'mongodb';

/**
 * Fetch and cache transactions for all users with tracked wallets
 */
async function fetchAllWalletTransactions() {
  try {
    console.log('🚀 Starting wallet transactions fetch process...');

    await withMongoDB(async client => {
      const db = client.db('trackerfi');
      
      // Get all users who have tracked wallets
      const users = await db.collection('users').find(
        { wallets: { $exists: true, $ne: [] } },
        { projection: { _id: 1, email: 1, wallets: 1 } }
      ).toArray();

      console.log(`Found ${users.length} users with tracked wallets`);

      let successCount = 0;
      let errorCount = 0;

      for (const user of users) {
        try {
          const userId = user._id.toString();
          const walletCount = user.wallets?.length || 0;
          
          console.log(`\nFetching transactions for user ${userId} (${user.email || 'no email'}) - ${walletCount} wallets`);
          
          // Fetch transactions for this user (will cache them)
          const result = await getUserTransactions(userId, { limit: 100 });
          
          console.log(`✓ Fetched and cached ${result.totalCount} transactions for user ${userId}`);
          successCount++;
          
          // Small delay to avoid hammering the API
          await new Promise(res => setTimeout(res, 1000));
          
        } catch (error) {
          console.error(`✗ Failed to fetch transactions for user ${user._id}:`, error);
          errorCount++;
        }
      }

      console.log('\n=== SUMMARY ===');
      console.log(`Total users: ${users.length}`);
      console.log(`Successful: ${successCount}`);
      console.log(`Failed: ${errorCount}`);
    });

    console.log('✅ Wallet transactions fetch process completed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Wallet transactions fetch process failed:', error);
    process.exit(1);
  }
}

// Run the script
fetchAllWalletTransactions();
