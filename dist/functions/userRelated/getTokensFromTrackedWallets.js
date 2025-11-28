"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getTokensFromTrackedWallets;
const mongodb_1 = require("mongodb");
const mongo_1 = __importDefault(require("../../mongo"));
const getTokensFromWallet_1 = __importDefault(require("../wallets/getTokensFromWallet"));
async function getTokensFromTrackedWallets(userId, client) {
    let shouldCloseClient = false;
    if (!client) {
        client = (0, mongo_1.default)();
        shouldCloseClient = true;
    }
    try {
        const db = client.db("trackerfi");
        // Get user's tracked wallets from the `users` collection
        const user = await db.collection("users").findOne({ _id: new mongodb_1.ObjectId(userId) }, { projection: { wallets: 1 } });
        if (!user || !user.wallets) {
            return [];
        }
        const allTokens = [];
        // Get tokens for each tracked wallet
        for (const wallet of user.wallets) {
            try {
                const tokens = await (0, getTokensFromWallet_1.default)(wallet.address, client);
                // Add wallet info to each token
                const tokensWithWallet = tokens.map((token) => ({
                    ...token,
                    wallet_address: wallet.address,
                    wallet_chain: wallet.chain
                }));
                allTokens.push(...tokensWithWallet);
            }
            catch (error) {
                console.error(`Error fetching tokens for wallet ${wallet.address}:`, error);
                // Continue with other wallets even if one fails
            }
        }
        return allTokens;
    }
    catch (error) {
        console.error("Error getting tokens from tracked wallets:", error);
        throw error;
    }
    finally {
        if (shouldCloseClient && client) {
            await client.close();
        }
    }
}
