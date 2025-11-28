"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_1 = __importDefault(require("../../mongo"));
const mongodb_1 = require("../../utils/mongodb");
const getUserWallets = async (req) => {
    const client = (0, mongo_1.default)();
    try {
        await client.connect();
        const database = client.db("trackerfi");
        const userId = req.params.userId;
        const objectId = (0, mongodb_1.toObjectId)(userId);
        if (!objectId) {
            return { status: 400, message: "Invalid user ID" };
        }
        // Check if user exists in the users collection and read embedded wallets
        const user = await database.collection("users").findOne({ _id: objectId });
        if (!user) {
            return { status: 404, message: "User not found" };
        }
        const wallets = user.wallets || [];
        const walletsWithId = wallets.map((wallet, idx) => ({
            id: `${userId}-${wallet.chain}-${idx}`,
            user_id: userId,
            blockchain: wallet.chain,
            wallet_address: wallet.address,
            connected_at: wallet.connected_at
        }));
        return {
            status: 200,
            message: {
                message: "Wallets retrieved successfully",
                wallets: walletsWithId
            }
        };
    }
    catch (error) {
        console.error("Error retrieving user wallets:", error);
        return { status: 500, message: "Error retrieving user wallets" };
    }
    finally {
        await client.close();
    }
};
exports.default = getUserWallets;
