import { ObjectId } from 'mongodb';
import { getDb } from '../../mongo';
import User from '../../interfaces/userInterface';
import { encryptApiCredential, maskApiCredential } from '../../utils/cryptoUtils';

interface UpdateExchangeRequest {
  api_key?: string;
  api_secret?: string;
}

interface UpdateExchangeResponse {
  success: boolean;
  message: string;
  exchange?: {
    id: string;
    name: string;
    api_key: string; // masked
    updated_at: Date;
  };
}

export default async function updateExchange(
  exchangeId: string,
  updateData: UpdateExchangeRequest
): Promise<UpdateExchangeResponse> {
  const db = await getDb();
  const usersCollection = db.collection<User>('users');

  // Parse composite ID (userId-exchangeName-index)
  const [userId, exchangeName, indexStr] = exchangeId.split('-');
  const exchangeIndex = parseInt(indexStr);

  if (!userId || !exchangeName || isNaN(exchangeIndex)) {
    return {
      success: false,
      message: 'Invalid exchange ID format'
    };
  }

  // Validate update data
  if (!updateData.api_key && !updateData.api_secret) {
    return {
      success: false,
      message: 'At least one field (api_key or api_secret) must be provided'
    };
  }

  // Find user
  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
  if (!user) {
    return {
      success: false,
      message: 'User not found'
    };
  }

  // Check if exchange exists
  if (!user.exchanges || exchangeIndex >= user.exchanges.length) {
    return {
      success: false,
      message: 'Exchange not found'
    };
  }

  const exchange = user.exchanges[exchangeIndex];
  if (exchange.name !== exchangeName) {
    return {
      success: false,
      message: 'Exchange ID mismatch'
    };
  }

  // Prepare update fields with encryption
  const updateFields: any = {
    updated_at: new Date()
  };

  if (updateData.api_key) {
    updateFields['api_key'] = encryptApiCredential(updateData.api_key);
  }
  if (updateData.api_secret) {
    updateFields['api_secret'] = encryptApiCredential(updateData.api_secret);
  }

  // Update the specific exchange in the array
  const updateQuery: any = {};
  Object.keys(updateFields).forEach(key => {
    updateQuery[`exchanges.${exchangeIndex}.${key}`] = updateFields[key];
  });

  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: updateQuery }
  );

  return {
    success: true,
    message: 'Exchange updated successfully',
    exchange: {
      id: exchangeId,
      name: exchange.name,
      api_key: maskApiCredential(updateData.api_key || 'unchanged'),
      updated_at: updateFields.updated_at
    }
  };
}