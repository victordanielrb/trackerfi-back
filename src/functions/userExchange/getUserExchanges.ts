import { ObjectId } from 'mongodb';
import { withMongoDB } from '../../mongo';
import User from '../../interfaces/userInterface';
import { decryptApiCredential, maskApiCredential } from '../../utils/cryptoUtils';

interface ExchangeResponse {
  id: string;
  name: string;
  api_key: string; // masked
  api_secret: string; // masked
  connected_at: Date;
  updated_at: Date;
}

interface GetUserExchangesResponse {
  success: boolean;
  message: string;
  exchanges?: ExchangeResponse[];
}

export default async function getUserExchanges(
  userId: string
): Promise<GetUserExchangesResponse> {
  return withMongoDB(async (client) => {
    const db = client.db('trackerfi');
    const usersCollection = db.collection<User>('users');

    // Find user
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    if (!user.exchanges || user.exchanges.length === 0) {
      return {
        success: true,
        message: 'No exchanges found',
        exchanges: []
      };
    }

    // Map exchanges to response format with composite IDs and masked credentials
    const exchanges: ExchangeResponse[] = user.exchanges.map((exchange, index) => {
      try {
        // Decrypt the credentials first, then mask them
        const decryptedApiKey = decryptApiCredential(exchange.api_key);
        const decryptedApiSecret = decryptApiCredential(exchange.api_secret);

        return {
          id: `${userId}-${exchange.name}-${index}`,
          name: exchange.name,
          api_key: maskApiCredential(decryptedApiKey),
          api_secret: maskApiCredential(decryptedApiSecret),
          connected_at: exchange.connected_at || new Date(),
          updated_at: exchange.updated_at || new Date()
        };
      } catch (error) {
        // Fallback for any decryption errors - log and return masked original
        console.error('Error decrypting credentials for exchange:', exchange.name, error);
        return {
          id: `${userId}-${exchange.name}-${index}`,
          name: exchange.name,
          api_key: '***encrypted***',
          api_secret: '***encrypted***',
          connected_at: exchange.connected_at || new Date(),
          updated_at: exchange.updated_at || new Date()
        };
      }
    });

    return {
      success: true,
      message: 'Exchanges retrieved successfully',
      exchanges
    };
  });
}