"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = removeTrackedWallet;
const mongodb_1 = require("mongodb");
const mongo_1 = __importDefault(require("../../mongo"));
async function removeTrackedWallet(userId, walletAddress, chain, client) {
    let shouldCloseClient = false;
    if (!client) {
        client = (0, mongo_1.default)();
        shouldCloseClient = true;
    }
    try {
        const db = client.db("trackerfi");
        const result = await db.collection("users").updateOne({ _id: new mongodb_1.ObjectId(userId) }, {
            $pull: {
                wallets: {
                    address: walletAddress,
                    chain: chain
                }
            }
        });
        if (result.matchedCount === 0) {
            throw new Error("User not found");
        }
        if (result.modifiedCount === 0) {
            throw new Error("Wallet not found in tracking list");
        }
        return { success: true, message: "Wallet removed from tracking list" };
    }
    catch (error) {
        console.error("Error removing tracked wallet:", error);
        throw error;
    }
    finally {
        if (shouldCloseClient && client) {
            await client.close();
        }
    }
}
