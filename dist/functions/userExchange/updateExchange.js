"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = updateExchange;
const mongodb_1 = require("mongodb");
const mongo_1 = require("../../mongo");
const cryptoUtils_1 = require("../../utils/cryptoUtils");
async function updateExchange(exchangeId, updateData) {
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
        // Validate update data
        if (!updateData.api_key && !updateData.api_secret) {
            return {
                success: false,
                message: 'At least one field (api_key or api_secret) must be provided'
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
        // Prepare update fields with encryption
        const updateFields = {
            updated_at: new Date()
        };
        if (updateData.api_key) {
            updateFields['api_key'] = (0, cryptoUtils_1.encryptApiCredential)(updateData.api_key);
        }
        if (updateData.api_secret) {
            updateFields['api_secret'] = (0, cryptoUtils_1.encryptApiCredential)(updateData.api_secret);
        }
        // Update the specific exchange in the array
        const updateQuery = {};
        Object.keys(updateFields).forEach(key => {
            updateQuery[`exchanges.${exchangeIndex}.${key}`] = updateFields[key];
        });
        await usersCollection.updateOne({ _id: new mongodb_1.ObjectId(userId) }, { $set: updateQuery });
        return {
            success: true,
            message: 'Exchange updated successfully',
            exchange: {
                id: exchangeId,
                name: exchange.name,
                api_key: (0, cryptoUtils_1.maskApiCredential)(updateData.api_key || 'unchanged'),
                updated_at: updateFields.updated_at
            }
        };
    });
}
