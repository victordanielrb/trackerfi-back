"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getUserFuturesPositions;
const mongodb_1 = require("mongodb");
const mongo_1 = require("../../mongo");
const getMEXCFuturesPositions_1 = __importDefault(require("./getMEXCFuturesPositions"));
async function getUserFuturesPositions(userId) {
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
                message: 'No exchanges configured',
                positions: []
            };
        }
        const allPositions = [];
        const errors = [];
        // Process each exchange
        for (const exchange of user.exchanges) {
            try {
                if (exchange.name.toLowerCase() === 'mexc') {
                    const mexcResult = await (0, getMEXCFuturesPositions_1.default)(exchange.api_key, exchange.api_secret);
                    if (mexcResult.success && mexcResult.positions) {
                        // Transform MEXC positions to our format
                        const transformedPositions = mexcResult.positions.map(pos => ({
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
                    }
                    else {
                        errors.push(`MEXC: ${mexcResult.message}`);
                    }
                }
                // Add support for other exchanges here (Binance, etc.)
            }
            catch (error) {
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
