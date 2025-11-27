import mongo from '../../mongo';
import { ObjectId } from 'mongodb';

export default async function addAlert(userId: string, alert: any) {
  const client = mongo();
  try {
    await client.connect();
    const db = client.db('trackerfi');
    const now = new Date().toISOString();
    const alertDoc = {
      ...alert,
      created_at: now,
      updated_at: now
    };

    const res = await (db.collection('users') as any).updateOne(
      { _id: new ObjectId(userId) },
      { $push: { alerts: alertDoc } }
    );

    return { matchedCount: res.matchedCount, modifiedCount: res.modifiedCount };
  } catch (err) {
    console.error('addAlert error:', err);
    throw err;
  } finally {
    try { await client.close(); } catch (e) { /* ignore */ }
  }
}
