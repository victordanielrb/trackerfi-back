import { withMongoDB } from '../../mongo';
import { ObjectId } from 'mongodb';

/**
 * Delete an alert by index for a user
 */
export async function deleteAlert(
  userId: string,
  alertIndex: number
): Promise<{ success: boolean; modifiedCount: number }> {
  return await withMongoDB(async client => {
    const db = client.db('trackerfi');
    
    // First, get the current alerts
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { alerts: 1 } }
    );
    
    if (!user || !user.alerts || alertIndex >= user.alerts.length) {
      return { success: false, modifiedCount: 0 };
    }
    
    // Remove the alert at the specified index
    const updatedAlerts = [...user.alerts];
    updatedAlerts.splice(alertIndex, 1);
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { alerts: updatedAlerts } }
    );
    
    return { success: result.modifiedCount > 0, modifiedCount: result.modifiedCount };
  });
}

/**
 * Delete an alert by token_id for a user
 */
export async function deleteAlertByTokenId(
  userId: string,
  tokenId: string
): Promise<{ success: boolean; modifiedCount: number }> {
  return await withMongoDB(async client => {
    const db = client.db('trackerfi');
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $pull: { alerts: { token_id: tokenId } } as any }
    );
    
    return { success: result.modifiedCount > 0, modifiedCount: result.modifiedCount };
  });
}

export default deleteAlert;
