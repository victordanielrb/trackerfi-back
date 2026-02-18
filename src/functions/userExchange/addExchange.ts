import { ObjectId } from 'mongodb';
import { getDb } from '../../mongo';
import User from '../../interfaces/userInterface';
import { encryptApiCredential, maskApiCredential } from '../../utils/cryptoUtils';

interface AddExchangeRequest {
  name: string;
  api_key: string;
  api_secret: string;
}

interface AddExchangeResponse {
  success: boolean;
  message: string;
  exchange?: {
    id: string;
    name: string;
    api_key: string;
    connected_at: Date;
  };
}

export default async function addExchange(
  userId: string,
  exchangeData: AddExchangeRequest
): Promise<AddExchangeResponse> {
  const db = await getDb();
  const usersCollection = db.collection<User>('users');

  // Validate exchange name
  const supportedExchanges = ['binance', 'coinbase', 'kraken', 'bitfinex', 'okx', 'bybit', 'mexc', 'gate'];
  if (!supportedExchanges.includes(exchangeData.name.toLowerCase())) {
    return {
      success: false,
      message: `Unsupported exchange. Supported exchanges: ${supportedExchanges.join(', ')}`
    };
  }

  // Validate API key and secret
  if (!exchangeData.api_key || !exchangeData.api_secret) {
    return {
      success: false,
      message: 'API key and API secret are required'
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

  // Check if exchange already exists
  if (user.exchanges) {
    const existingExchange = user.exchanges.find(
      ex => ex.name.toLowerCase() === exchangeData.name.toLowerCase()
    );
    if (existingExchange) {
      return {
        success: false,
        message: `Exchange ${exchangeData.name} already connected`
      };
    }
  }

  // Create new exchange object with encrypted credentials
  const newExchange = {
    name: exchangeData.name.toLowerCase(),
    api_key: encryptApiCredential(exchangeData.api_key),
    api_secret: encryptApiCredential(exchangeData.api_secret),
    connected_at: new Date(),
    updated_at: new Date()
  };

  // Add exchange to user's exchanges array
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    {
      $push: { exchanges: newExchange as any }
    }
  );

  // Get updated user to find the index
  const updatedUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
  const exchangeIndex = (updatedUser?.exchanges?.length || 1) - 1;

  return {
    success: true,
    message: 'Exchange connected successfully',
    exchange: {
      id: `${userId}-${exchangeData.name.toLowerCase()}-${exchangeIndex}`,
      name: newExchange.name,
      api_key: newExchange.api_key.substring(0, 8) + '***', // mask API key in response
      connected_at: newExchange.connected_at
    }
  };
}