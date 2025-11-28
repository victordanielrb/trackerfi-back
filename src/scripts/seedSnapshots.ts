import 'dotenv/config';
import { withMongoDB } from '../mongo';
import { ObjectId } from 'mongodb';

// Usage: node dist/scripts/seedSnapshots.js <userId>

(async function main() {
  try {
    const userIdArg = process.argv[2];
    await withMongoDB(async client => {
      const db = client.db('trackerfi');
      const users = await db.collection('users').find({}, { projection: { _id: 1, email: 1 } }).toArray();

      let userId: string|undefined = userIdArg;
      if (!userId && users.length > 0) {
        userId = users[0]._id.toString();
        console.log('No userId provided, using first user:', userId);
      }
      if (!userId) {
        throw new Error('No user accounts found. Create a user first.');
      }

      const now = new Date();
      const snapshots: any[] = [];

      // Generate 30 daily snapshots with increasing or slightly varied values
      for (let i = 30; i >= 0; i--) {
        const ts = new Date(now);
        ts.setDate(now.getDate() - i);
        const total = 1000 + Math.round(Math.random() * 1000) + (30 - i) * 25;
        const wallets = [
          { address: '0x000', chain: 'ETH', value_usd: total * 0.4 },
          { address: '0x1', chain: 'SOL', value_usd: total * 0.6 },
        ];
        const tokens = [
          { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', total_quantity: 0.01 * (1 + i/100), total_value: total * 0.4 },
          { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', total_quantity: 0.2 * (1 + i/200), total_value: total * 0.6 }
        ];

        snapshots.push({
          user_id: new ObjectId(userId),
          user_email: (users.find(u => u._id.toString() === userId) || {}).email || null,
          timestamp: ts,
          total_value_usd: total,
          wallets,
          tokens
        });
      }

      const res = await db.collection('snapshots').insertMany(snapshots);
      console.log('Inserted snapshots:', res.insertedCount);
    });

    console.log('Done seeding snapshots');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding snapshots:', err);
    process.exit(1);
  }
})();
