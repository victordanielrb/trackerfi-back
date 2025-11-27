"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_1 = __importDefault(require("../../mongo"));
const mongodb_1 = require("../../utils/mongodb");
const getWalletById = async (req) => {
    const client = (0, mongo_1.default)();
    try {
        await client.connect();
        const database = client.db("trackerfi");
        // Expect walletId in the format: <userId>-<chain>-<idx>
        const walletId = req.params.id;
        const parts = walletId.split('-');
        if (parts.length < 2) {
            return { message: "Invalid wallet ID format", status: 400 };
        }
        const userId = parts[0];
        const chain = parts[1];
        const idx = parts.length > 2 ? parseInt(parts[2], 10) : undefined;
        const objectId = (0, mongodb_1.toObjectId)(userId);
        if (!objectId) {
            return { message: "Invalid user ID in wallet ID", status: 400 };
        }
        const user = await database.collection("users").findOne({ _id: objectId });
        if (!user) {
            return { message: "User not found", status: 404 };
        }
        const wallets = user.wallets || [];
        let walletEntry = null;
        if (typeof idx === 'number' && !isNaN(idx)) {
            walletEntry = wallets[idx];
        }
        else {
            walletEntry = wallets.find((w) => String(w.chain) === chain);
        }
        if (!walletEntry) {
            return { message: "Wallet not found", status: 404 };
        }
        return {
            message: {
                id: walletId,
                user_id: userId,
                blockchain: walletEntry.chain,
                wallet_address: walletEntry.address,
                connected_at: walletEntry.connected_at,
                updated_at: walletEntry.updated_at
            },
            status: 200
        };
    }
    catch (error) {
        console.error("Error retrieving wallet:", error);
        return { message: "Error retrieving wallet", status: 500 };
    }
    finally {
        await client.close();
    }
};
exports.default = getWalletById;
