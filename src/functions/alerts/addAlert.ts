import { withMongoDB } from '../../mongo';
import { ObjectId } from 'mongodb';

export interface CreateAlertInput {
  token_id: string; // CoinGecko ID
  token_symbol: string;
  token_name: string;
  price_threshold: number;
  alert_type: 'price_above' | 'price_below';
}

/**
 * Add a new alert for a user
 */
export async function addAlert(
  userId: string,
  alertData: CreateAlertInput
): Promise<{ success: boolean; modifiedCount: number }> {
  return await withMongoDB(async client => {
    const db = client.db('trackerfi');
    const now = new Date().toISOString();
    
    const alertDoc = {
      token_id: alertData.token_id,
      token_symbol: alertData.token_symbol.toUpperCase(),
      token_name: alertData.token_name,
      price_threshold: alertData.price_threshold,
      alert_type: alertData.alert_type,
      is_active: true,
      created_at: now,
      updated_at: now,
      triggered_count: 0
    };

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $push: { alerts: alertDoc } as any }
    );

    return { success: result.modifiedCount > 0, modifiedCount: result.modifiedCount };
  });
}

export default addAlert;
