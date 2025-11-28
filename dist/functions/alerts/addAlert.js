"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = addAlert;
const mongo_1 = __importDefault(require("../../mongo"));
const mongodb_1 = require("mongodb");
async function addAlert(userId, alert) {
    const client = (0, mongo_1.default)();
    try {
        await client.connect();
        const db = client.db('trackerfi');
        const now = new Date().toISOString();
        const alertDoc = {
            ...alert,
            created_at: now,
            updated_at: now
        };
        const res = await db.collection('users').updateOne({ _id: new mongodb_1.ObjectId(userId) }, { $push: { alerts: alertDoc } });
        return { matchedCount: res.matchedCount, modifiedCount: res.modifiedCount };
    }
    catch (err) {
        console.error('addAlert error:', err);
        throw err;
    }
    finally {
        try {
            await client.close();
        }
        catch (e) { /* ignore */ }
    }
}
