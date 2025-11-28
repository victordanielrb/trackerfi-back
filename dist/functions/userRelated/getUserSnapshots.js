"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getUserSnapshots;
const mongo_1 = __importDefault(require("../../mongo"));
const mongodb_1 = require("mongodb");
async function getUserSnapshots(userId, options) {
    const client = (0, mongo_1.default)();
    try {
        await client.connect();
        const db = client.db("trackerfi");
        const query = { user_id: new mongodb_1.ObjectId(userId) };
        // Filter by date range if days specified
        if (options?.days) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - options.days);
            query.timestamp = { $gte: startDate };
        }
        const snapshots = await db
            .collection("snapshots")
            .find(query)
            .sort({ timestamp: -1 })
            .limit(options?.limit || 30)
            .toArray();
        return snapshots.map(s => ({
            _id: s._id.toString(),
            user_id: s.user_id.toString(),
            timestamp: s.timestamp.toISOString(),
            total_value_usd: s.total_value_usd || 0,
            wallets: s.wallets || [],
            tokens: s.tokens || []
        }));
    }
    finally {
        await client.close();
    }
}
