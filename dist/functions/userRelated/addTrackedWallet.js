"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = addTrackedWallet;
const mongodb_1 = require("mongodb");
const mongo_1 = __importDefault(require("../../mongo"));
async function addTrackedWallet(userId, walletAddress, chain, client) {
    let shouldCloseClient = false;
    if (!client) {
        client = (0, mongo_1.default)();
        shouldCloseClient = true;
    }
    try {
        const db = client.db("trackerfi");
        // Check if wallet is already tracked by this user in the users collection
        const existingUser = await db.collection("users").findOne({
            _id: new mongodb_1.ObjectId(userId),
            "wallets.address": walletAddress,
            "wallets.chain": chain
        });
        if (existingUser) {
            throw new Error("Wallet already tracked by this user");
        }
        // Add wallet to user's tracked wallets in the users collection
        const result = await db.collection("users").updateOne({ _id: new mongodb_1.ObjectId(userId) }, {
            $addToSet: {
                wallets: {
                    address: walletAddress,
                    chain: chain
                }
            }
        });
        if (result.matchedCount === 0) {
            throw new Error("User not found");
        }
        return { success: true, message: "Wallet added to tracking list" };
    }
    catch (error) {
        console.error("Error adding tracked wallet:", error);
        throw error;
    }
    finally {
        if (shouldCloseClient && client) {
            await client.close();
        }
    }
}
