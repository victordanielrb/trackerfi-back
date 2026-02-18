import { getDb } from "../../mongo";
import { ObjectId } from "mongodb";

export interface SnapshotData {
  _id: string;
  user_id: string;
  timestamp: string;
  total_value_usd: number;
  wallets: Array<{
    address: string;
    chain: string;
    value_usd: number;
  }>;
  tokens: Array<{
    id: string;
    symbol: string;
    name: string;
    total_quantity: number;
    total_value: number;
  }>;
}

export default async function getUserSnapshots(
  userId: string,
  options?: {
    limit?: number;
    days?: number;
  }
): Promise<SnapshotData[]> {
  const db = await getDb();

  const query: any = { user_id: new ObjectId(userId) };

  // Filter by date range if days specified
  if (options?.days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - options.days);
    query.timestamp = { $gte: startDate };
  }

  const snapshots = await db
    .collection("snapshots")
    .find(query)
    .sort({ timestamp: -1 })
    .limit(options?.limit || 30)
    .toArray();

  return snapshots.map(s => ({
    _id: s._id.toString(),
    user_id: s.user_id.toString(),
    timestamp: s.timestamp.toISOString(),
    total_value_usd: s.total_value_usd || 0,
    wallets: s.wallets || [],
    tokens: s.tokens || []
  }));
}
