import { ObjectId } from 'mongodb';
import { withMongoDB } from '../../mongo';
import User from '../../interfaces/userInterface';
import getMEXCFuturesPositions from './getMEXCFuturesPositions';

interface FuturesPosition {
  exchange: string;
  positionId: number;
  symbol: string;
  positionType: number; // 1: long, 2: short
  holdVol: number;
  holdAvgPrice: number;
  liquidatePrice: number;
  realised: number;
  leverage: number;
  createTime: number;
  updateTime: number;
  pnl?: number; // calculated PnL if we have current price
}

interface GetFuturesPositionsResponse {
  success: boolean;
  message: string;
  positions?: FuturesPosition[];
  errors?: string[];
}

export default async function getUserFuturesPositions(
  userId: string
): Promise<GetFuturesPositionsResponse> {
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
        message: 'No exchanges configured',
        positions: []
      };
    }

    const allPositions: FuturesPosition[] = [];
    const errors: string[] = [];

    // Process each exchange
    for (const exchange of user.exchanges) {
      try {
        if (exchange.name.toLowerCase() === 'mexc') {
          const mexcResult = await getMEXCFuturesPositions(
            exchange.api_key,
            exchange.api_secret
          );

          if (mexcResult.success && mexcResult.positions) {
            // Transform MEXC positions to our format
            const transformedPositions: FuturesPosition[] = mexcResult.positions.map(pos => ({
              exchange: 'mexc',
              positionId: pos.positionId,
              symbol: pos.symbol,
              positionType: pos.positionType,
              holdVol: pos.holdVol,
              holdAvgPrice: pos.holdAvgPrice,
              liquidatePrice: pos.liquidatePrice,
              realised: pos.realised,
              leverage: pos.leverage,
              createTime: pos.createTime,
              updateTime: pos.updateTime
            }));

            allPositions.push(...transformedPositions);
          } else {
            errors.push(`MEXC: ${mexcResult.message}`);
          }
        }
        // Add support for other exchanges here (Binance, etc.)
      } catch (error: any) {
        console.error(`Error fetching futures positions for ${exchange.name}:`, error);
        errors.push(`${exchange.name}: ${error.message}`);
      }
    }

    return {
      success: true,
      message: `Retrieved ${allPositions.length} futures positions`,
      positions: allPositions,
      errors: errors.length > 0 ? errors : undefined
    };
  });
}