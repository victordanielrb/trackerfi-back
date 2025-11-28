import axios from 'axios';
import crypto from 'crypto';
import { decryptApiCredential, isEncrypted } from '../../utils/cryptoUtils';

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
    // Decrypt the API credentials with fallback for unencrypted data
    let decryptedApiKey: string;
    let decryptedApiSecret: string;

    // Check if credentials are encrypted and handle accordingly
    if (isEncrypted(apiKey) && isEncrypted(apiSecret)) {
      try {
        decryptedApiKey = decryptApiCredential(apiKey);
        decryptedApiSecret = decryptApiCredential(apiSecret);
        console.log('Successfully decrypted MEXC API credentials');
      } catch (decryptError) {
        console.error('Failed to decrypt MEXC API credentials:', decryptError);
        return {
          success: false,
          message: 'Failed to decrypt API credentials. Please re-add your MEXC exchange.',
          exchange: 'mexc'
        };
      }
    } else {
      console.warn('MEXC API credentials appear to be unencrypted, using as-is');
      // Fallback: assume credentials are already in plaintext (for backwards compatibility)
      decryptedApiKey = apiKey;
      decryptedApiSecret = apiSecret;
    }

    // MEXC API endpoint for futures positions
    const baseUrl = 'https://contract.mexc.com';
    const endpoint = '/api/v1/private/position/open_positions';
    
    // Generate timestamp (MEXC requires timestamp in milliseconds)
    const timestamp = Date.now().toString();
    
    // MEXC signature method: accessKey + reqTime + requestParam
    // For GET requests with no additional params, requestParam is empty string
    const signaturePayload = decryptedApiKey + timestamp + '';
    const signature = crypto
      .createHmac('sha256', decryptedApiSecret)
      .update(signaturePayload)
      .digest('hex');

    console.log('MEXC API Request:', {
      url: `${baseUrl}${endpoint}`,
      timestamp,
      apiKeyPrefix: decryptedApiKey.substring(0, 8) + '...',
      signaturePayload: signaturePayload.substring(0, 32) + '...',
      signaturePrefix: signature.substring(0, 16) + '...'
    });

    // Make request to MEXC API with proper authentication headers
    const response = await axios.get(`${baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TrackerFi/1.0',
        'ApiKey': decryptedApiKey,
        'Request-Time': timestamp,
        'Signature': signature
      },
      timeout: 10000
    });
    

    const mexcData: MEXCFuturesResponse = response.data;

    console.log('MEXC API Response:', {
      success: mexcData.success,
      code: mexcData.code,
      dataLength: mexcData.data?.length || 0
    });

    if (!mexcData.success) {
      return {
        success: false,
        message: `MEXC API error: Code ${mexcData.code}`,
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
      console.error('MEXC API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      return {
        success: false,
        message: `MEXC API error: ${error.response.status} - ${error.response.data?.message || error.response.statusText || 'Unknown error'}`,
        exchange: 'mexc'
      };
    }

    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        message: 'MEXC API request timeout - please try again',
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