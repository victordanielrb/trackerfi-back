import 'dotenv/config';
import { withMongoDB } from '../mongo';
import getWalletTransactions from '../functions/wallets/getWalletTransactions';

// Simple concurrency limiter
const MAX_CONCURRENT = 5;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processWallets(addresses: string[]) {
  const queue = [...addresses];
  const workers: Promise<void>[] = [];

  async function worker() {
    while (queue.length > 0) {
      const addr = queue.shift();
      if (!addr) break;
      try {
        console.log(`Fetching transactions for ${addr}`);
        await getWalletTransactions(addr);
      } catch (err) {
        console.warn(`Failed fetching transactions for ${addr}:`, err);
      }
      // Be nice to the API / DB
      await sleep(500);
    }
  }

  for (let i = 0; i < Math.min(MAX_CONCURRENT, addresses.length); i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
}

(async function main() {
  try {
    console.log('🚀 Starting refreshWalletTransactions script...');

    await withMongoDB(async client => {
      const db = client.db('trackerfi');
      const users = await db.collection('users').find({}, { projection: { wallets: 1 } }).toArray();
      const allWallets: string[] = [];
      users.forEach(u => {
        const wallets = (u as any).wallets || [];
        wallets.forEach((w: any) => {
          if (w && w.address) allWallets.push(w.address);
        });
      });

      // Unique addresses
      const uniqueWallets = [...new Set(allWallets)];
      console.log(`Found ${uniqueWallets.length} tracked wallets to refresh`);

      if (uniqueWallets.length === 0) {
        console.log('No wallets found - exiting');
        return;
      }

      await processWallets(uniqueWallets);
    });

    console.log('✅ refreshWalletTransactions completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ refreshWalletTransactions failed:', error);
    process.exit(1);
  }
})();
