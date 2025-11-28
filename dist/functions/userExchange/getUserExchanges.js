"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getUserExchanges;
const mongodb_1 = require("mongodb");
const mongo_1 = require("../../mongo");
const cryptoUtils_1 = require("../../utils/cryptoUtils");
async function getUserExchanges(userId) {
    return (0, mongo_1.withMongoDB)(async (client) => {
        const db = client.db('trackerfi');
        const usersCollection = db.collection('users');
        // Find user
        const user = await usersCollection.findOne({ _id: new mongodb_1.ObjectId(userId) });
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
        const exchanges = user.exchanges.map((exchange, index) => {
            try {
                // Decrypt the credentials first, then mask them
                const decryptedApiKey = (0, cryptoUtils_1.decryptApiCredential)(exchange.api_key);
                const decryptedApiSecret = (0, cryptoUtils_1.decryptApiCredential)(exchange.api_secret);
                return {
                    id: `${userId}-${exchange.name}-${index}`,
                    name: exchange.name,
                    api_key: (0, cryptoUtils_1.maskApiCredential)(decryptedApiKey),
                    api_secret: (0, cryptoUtils_1.maskApiCredential)(decryptedApiSecret),
                    connected_at: exchange.connected_at || new Date(),
                    updated_at: exchange.updated_at || new Date()
                };
            }
            catch (error) {
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
