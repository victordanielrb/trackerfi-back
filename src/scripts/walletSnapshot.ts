import 'dotenv/config';
import { withMongoDB } from '../mongo';
import getTokensFromWallet from '../functions/wallets/getTokensFromWallet';
import { ObjectId } from 'mongodb';

async function snapshotUser(user: any, db: any) {
  try {
    const userId = user._id;
    const wallets = user.wallets || [];
    const snapshotWallets: any[] = [];

    let totalValueUSD = 0;

    for (const w of wallets) {
      try {
        const addr = w.address;
        const tokens = await getTokensFromWallet(addr);
        const walletValue = tokens.reduce((s, t) => s + (Number(t.value) || 0), 0);
        totalValueUSD += walletValue;
        snapshotWallets.push({ address: addr, chain: w.chain, value_usd: walletValue, tokens });
      } catch (sanpErr) {
        console.warn(`Failed to snapshot wallet ${w.address} for user ${userId}:`, sanpErr);
      }
    }

    // Consolidate tokens across wallets by id
    const tokensMap: Map<string, any> = new Map();
    snapshotWallets.forEach(w => {
      (w.tokens || []).forEach((tk: any) => {
        const id = tk.id || `${tk.address}-${tk.chain}`;
        if (!tokensMap.has(id)) {
          tokensMap.set(id, { ...tk, total_quantity: Number(tk.quantity) || 0, total_value: Number(tk.value) || 0 });
        } else {
          const existing = tokensMap.get(id);
          existing.total_quantity += Number(tk.quantity) || 0;
          existing.total_value += Number(tk.value) || 0;
          tokensMap.set(id, existing);
        }
      });
    });

    const consolidatedTokens = Array.from(tokensMap.values());

    const snapshotDoc = {
      user_id: new ObjectId(userId),
      user_email: user.email || null,
      timestamp: new Date(),
      total_value_usd: totalValueUSD,
      wallets: snapshotWallets,
      tokens: consolidatedTokens
    };

    await db.collection('wallet_snapshots').insertOne(snapshotDoc);
    console.log(`Snapshot saved for user ${userId} (${consolidatedTokens.length} tokens, total_value=${totalValueUSD})`);
  } catch (error) {
    console.error('Failed to snapshot user', user._id, error);
  }
}

(async function main() {
  try {
    console.log('🚀 Starting wallet snapshot process...');

    await withMongoDB(async client => {
      const db = client.db('trackerfi');
      const users = await db.collection('users').find({}, { projection: { wallets: 1, email: 1 } }).toArray();
      console.log(`Found ${users.length} users to snapshot`);

      for (const user of users) {
        await snapshotUser(user, db);
        // Small sleep to avoid hammering external API
        await new Promise(res => setTimeout(res, 500));
      }
    });

    console.log('✅ Wallet snapshot process completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Wallet snapshot process failed:', error);
    process.exit(1);
  }
})();
