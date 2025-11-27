"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getExchangeForEdit;
const mongodb_1 = require("mongodb");
const mongo_1 = require("../../mongo");
const cryptoUtils_1 = require("../../utils/cryptoUtils");
async function getExchangeForEdit(exchangeId) {
    return (0, mongo_1.withMongoDB)(async (client) => {
        const db = client.db('trackerfi');
        const usersCollection = db.collection('users');
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
        const user = await usersCollection.findOne({ _id: new mongodb_1.ObjectId(userId) });
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
            const decryptedApiKey = (0, cryptoUtils_1.decryptApiCredential)(exchange.api_key);
            const decryptedApiSecret = (0, cryptoUtils_1.decryptApiCredential)(exchange.api_secret);
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
        }
        catch (error) {
            console.error('Error decrypting credentials for editing:', error);
            return {
                success: false,
                message: 'Failed to decrypt credentials'
            };
        }
    });
}
