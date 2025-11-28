"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getUserTrackedWallets;
const mongodb_1 = require("mongodb");
const mongo_1 = __importDefault(require("../../mongo"));
async function getUserTrackedWallets(userId, client) {
    let shouldCloseClient = false;
    if (!client) {
        client = (0, mongo_1.default)();
        shouldCloseClient = true;
    }
    try {
        const db = client.db("trackerfi");
        const user = await db.collection("users").findOne({ _id: new mongodb_1.ObjectId(userId) }, { projection: { wallets: 1 } });
        if (!user) {
            throw new Error("User not found");
        }
        return user.wallets || [];
    }
    catch (error) {
        console.error("Error getting user tracked wallets:", error);
        throw error;
    }
    finally {
        if (shouldCloseClient && client) {
            await client.close();
        }
    }
}
