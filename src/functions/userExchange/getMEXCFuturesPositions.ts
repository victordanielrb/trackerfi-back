import axios from 'axios';
import crypto from 'crypto';
import { decryptApiCredential } from '../../utils/cryptoUtils';

interface MEXCFuturesPosition {
  positionId: number;
  symbol: string;
  positionType: number; // 1: long, 2: short
  openType: number;
  state: number;
  holdVol: number;
  frozenVol: number;
  closeVol: number;
  holdAvgPrice: number;
  openAvgPrice: number;
  closeAvgPrice: number;
  liquidatePrice: number;
  oim: number;
  im: number;
  holdFee: number;
  realised: number;
  leverage: number;
  createTime: number;
  updateTime: number;
  autoAddIm: boolean;
}

interface MEXCFuturesResponse {
  success: boolean;
  code: number;
  data: MEXCFuturesPosition[];
}

interface FuturesPositionResponse {
  success: boolean;
  message: string;
  positions?: MEXCFuturesPosition[];
  exchange?: string;
}

export default async function getMEXCFuturesPositions(
  apiKey: string,
  apiSecret: string
): Promise<FuturesPositionResponse> {
  try {
    // Decrypt the API credentials
    const decryptedApiKey = decryptApiCredential(apiKey);
    const decryptedApiSecret = decryptApiCredential(apiSecret);

    // MEXC API endpoint for futures positions
    const baseUrl = 'https://contract.mexc.com';
    const endpoint = '/api/v1/private/position/open_positions';
    
    // Generate timestamp
    const timestamp = Date.now();
    
    // MEXC uses different authentication - API key in headers, signature in query
    const queryString = `req_time=${timestamp}`;
    const signature = crypto
      .createHmac('sha256', decryptedApiSecret)
      .update(queryString)
      .digest('hex');

    // Make request to MEXC API with proper authentication
    const response = await axios.get(`${baseUrl}${endpoint}`, {
      params: {
        req_time: timestamp,
        sign: signature
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TrackerFi/1.0',
        'ApiKey': decryptedApiKey  // MEXC expects API key in headers
      },
      timeout: 10000
    });

    const mexcData: MEXCFuturesResponse = response.data;

    if (!mexcData.success) {
      return {
        success: false,
        message: `MEXC API error: ${mexcData.code}`,
        exchange: 'mexc'
      };
    }

    return {
      success: true,
      message: 'Futures positions retrieved successfully',
      positions: mexcData.data || [],
      exchange: 'mexc'
    };

  } catch (error: any) {
    console.error('Error fetching MEXC futures positions:', error);
    
    if (error.response) {
      return {
        success: false,
        message: `MEXC API error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`,
        exchange: 'mexc'
      };
    }

    return {
      success: false,
      message: error.message || 'Failed to fetch MEXC futures positions',
      exchange: 'mexc'
    };
  }
}