import { getDb } from '../../mongo';
import { ObjectId } from 'mongodb';

interface UpdateAlertData {
  token_id?: string;
  token_symbol?: string;
  token_name?: string;
  price_threshold?: number;
  alert_type?: 'price_above' | 'price_below';
  is_active?: boolean;
}

/**
 * Update an alert by index for a user
 */
export async function updateAlert(
  userId: string,
  alertIndex: number,
  updateData: UpdateAlertData
): Promise<{ success: boolean; modifiedCount: number }> {
  const db = await getDb();

  // First, get the current alerts
  const user = await db.collection('users').findOne(
    { _id: new ObjectId(userId) },
    { projection: { alerts: 1 } }
  );

  if (!user || !user.alerts || alertIndex >= user.alerts.length) {
    return { success: false, modifiedCount: 0 };
  }

  // Build the update object for specific alert fields
  const updateFields: Record<string, any> = {};
  const now = new Date().toISOString();

  if (updateData.token_id !== undefined) {
    updateFields[`alerts.${alertIndex}.token_id`] = updateData.token_id;
  }
  if (updateData.token_symbol !== undefined) {
    updateFields[`alerts.${alertIndex}.token_symbol`] = updateData.token_symbol;
  }
  if (updateData.token_name !== undefined) {
    updateFields[`alerts.${alertIndex}.token_name`] = updateData.token_name;
  }
  if (updateData.price_threshold !== undefined) {
    updateFields[`alerts.${alertIndex}.price_threshold`] = updateData.price_threshold;
  }
  if (updateData.alert_type !== undefined) {
    updateFields[`alerts.${alertIndex}.alert_type`] = updateData.alert_type;
  }
  if (updateData.is_active !== undefined) {
    updateFields[`alerts.${alertIndex}.is_active`] = updateData.is_active;
  }

  // Always update the updated_at field
  updateFields[`alerts.${alertIndex}.updated_at`] = now;

  const result = await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: updateFields }
  );

  return { success: result.modifiedCount > 0, modifiedCount: result.modifiedCount };
}

export default updateAlert;
