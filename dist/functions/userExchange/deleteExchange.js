"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = deleteExchange;
const mongodb_1 = require("mongodb");
const mongo_1 = require("../../mongo");
async function deleteExchange(exchangeId) {
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
        // TODO: Add validation here to check if exchange is being used for any active operations
        // For example, check if there are any active trades or orders using this exchange
        // This would prevent accidental deletion of exchanges that are still in use
        // Remove the exchange from the array
        await usersCollection.updateOne({ _id: new mongodb_1.ObjectId(userId) }, {
            $pull: {
                exchanges: {
                    name: exchangeName,
                    api_key: exchange.api_key,
                    api_secret: exchange.api_secret
                }
            }
        });
        return {
            success: true,
            message: 'Exchange deleted successfully',
            deletedExchange: {
                id: exchangeId,
                name: exchange.name
            }
        };
    });
}
