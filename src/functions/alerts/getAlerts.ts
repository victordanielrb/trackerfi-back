import { withMongoDB } from '../../mongo';
import { ObjectId } from 'mongodb';

export interface Alert {
  _id?: string;
  token_id: string; // CoinGecko ID
  token_symbol: string;
  token_name: string;
  price_threshold: number;
  alert_type: 'price_above' | 'price_below';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_triggered?: string;
  triggered_count: number;
}

/**
 * Get all alerts for a user
 */
export async function getAlerts(userId: string): Promise<Alert[]> {
  return await withMongoDB(async client => {
    const db = client.db('trackerfi');
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { alerts: 1 } }
    );
    
    return user?.alerts || [];
  });
}

/**
 * Get a single alert by index for a user
 */
export async function getAlertByIndex(userId: string, alertIndex: number): Promise<Alert | null> {
  const alerts = await getAlerts(userId);
  return alerts[alertIndex] || null;
}

export default getAlerts;
