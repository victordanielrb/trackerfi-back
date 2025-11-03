import { ObjectId } from 'mongodb';
import { withMongoDB } from '../../mongo';
import User from '../../interfaces/userInterface';
import { decryptApiCredential } from '../../utils/cryptoUtils';

interface ExchangeEditResponse {
  success: boolean;
  message: string;
  exchange?: {
    id: string;
    name: string;
    api_key: string; // decrypted for editing
    api_secret: string; // decrypted for editing
    connected_at: Date;
    updated_at: Date;
  };
}

export default async function getExchangeForEdit(
  exchangeId: string
): Promise<ExchangeEditResponse> {
  return withMongoDB(async (client) => {
    const db = client.db('trackerfi');
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

    try {
      // Decrypt the credentials for editing using AES encryption (not bcrypt)
      // Note: We use AES encryption, not bcrypt, as bcrypt is for password hashing
      const decryptedApiKey = decryptApiCredential(exchange.api_key);
      const decryptedApiSecret = decryptApiCredential(exchange.api_secret);

      return {
        success: true,
        message: 'Exchange retrieved for editing',
        exchange: {
          id: exchangeId,
          name: exchange.name,
          api_key: decryptedApiKey,
          api_secret: decryptedApiSecret,
          connected_at: exchange.connected_at || new Date(),
          updated_at: exchange.updated_at || new Date()
        }
      };
    } catch (error) {
      console.error('Error decrypting credentials for editing:', error);
      return {
        success: false,
        message: 'Failed to decrypt credentials'
      };
    }
  });
}