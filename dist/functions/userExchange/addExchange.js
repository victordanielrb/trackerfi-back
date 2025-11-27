"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = addExchange;
const mongodb_1 = require("mongodb");
const mongo_1 = require("../../mongo");
const cryptoUtils_1 = require("../../utils/cryptoUtils");
async function addExchange(userId, exchangeData) {
    return (0, mongo_1.withMongoDB)(async (client) => {
        const db = client.db('trackerfi');
        const usersCollection = db.collection('users');
        // Validate exchange name
        const supportedExchanges = ['binance', 'coinbase', 'kraken', 'bitfinex', 'okx', 'bybit', 'mexc', 'gate'];
        if (!supportedExchanges.includes(exchangeData.name.toLowerCase())) {
            return {
                success: false,
                message: `Unsupported exchange. Supported exchanges: ${supportedExchanges.join(', ')}`
            };
        }
        // Validate API key and secret
        if (!exchangeData.api_key || !exchangeData.api_secret) {
            return {
                success: false,
                message: 'API key and API secret are required'
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
        // Check if exchange already exists
        if (user.exchanges) {
            const existingExchange = user.exchanges.find(ex => ex.name.toLowerCase() === exchangeData.name.toLowerCase());
            if (existingExchange) {
                return {
                    success: false,
                    message: `Exchange ${exchangeData.name} already connected`
                };
            }
        }
        // Create new exchange object with encrypted credentials
        const newExchange = {
            name: exchangeData.name.toLowerCase(),
            api_key: (0, cryptoUtils_1.encryptApiCredential)(exchangeData.api_key),
            api_secret: (0, cryptoUtils_1.encryptApiCredential)(exchangeData.api_secret),
            connected_at: new Date(),
            updated_at: new Date()
        };
        // Add exchange to user's exchanges array
        await usersCollection.updateOne({ _id: new mongodb_1.ObjectId(userId) }, {
            $push: { exchanges: newExchange }
        });
        // Get updated user to find the index
        const updatedUser = await usersCollection.findOne({ _id: new mongodb_1.ObjectId(userId) });
        const exchangeIndex = (updatedUser?.exchanges?.length || 1) - 1;
        return {
            success: true,
            message: 'Exchange connected successfully',
            exchange: {
                id: `${userId}-${exchangeData.name.toLowerCase()}-${exchangeIndex}`,
                name: newExchange.name,
                api_key: newExchange.api_key.substring(0, 8) + '***', // mask API key in response
                connected_at: newExchange.connected_at
            }
        };
    });
}
