"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getMEXCFuturesPositions;
const axios_1 = __importDefault(require("axios"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const cryptoUtils_1 = require("../../utils/cryptoUtils");
async function getMEXCFuturesPositions(apiKey, apiSecret) {
    try {
        // Decrypt the API credentials with fallback for unencrypted data
        let decryptedApiKey;
        let decryptedApiSecret;
        // Check if credentials are encrypted and handle accordingly
        if ((0, cryptoUtils_1.isEncrypted)(apiKey) && (0, cryptoUtils_1.isEncrypted)(apiSecret)) {
            try {
                decryptedApiKey = (0, cryptoUtils_1.decryptApiCredential)(apiKey);
                decryptedApiSecret = (0, cryptoUtils_1.decryptApiCredential)(apiSecret);
                console.log('Successfully decrypted MEXC API credentials');
            }
            catch (decryptError) {
                console.error('Failed to decrypt MEXC API credentials:', decryptError);
                return {
                    success: false,
                    message: 'Failed to decrypt API credentials. Please re-add your MEXC exchange.',
                    exchange: 'mexc'
                };
            }
        }
        else {
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
        const signature = node_crypto_1.default
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
        const response = await axios_1.default.get(`${baseUrl}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'TrackerFi/1.0',
                'ApiKey': decryptedApiKey,
                'Request-Time': timestamp,
                'Signature': signature
            },
            timeout: 10000
        });
        const mexcData = response.data;
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
    }
    catch (error) {
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
