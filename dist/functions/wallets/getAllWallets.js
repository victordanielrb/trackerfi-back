"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_1 = require("../../mongo");
const getAllWallets = async () => {
    try {
        const result = await (0, mongo_1.withMongoDB)(async (client) => {
            const database = client.db("trackerfi");
            // Aggregate wallets stored inside users.wallets array
            const usersWithWallets = await database.collection("users")
                .find({ "wallets.0": { $exists: true } })
                .project({ wallets: 1 })
                .toArray();
            const flattened = [];
            usersWithWallets.forEach((u) => {
                const userId = u._id?.toString();
                const wallets = u.wallets || [];
                wallets.forEach((w, idx) => {
                    flattened.push({
                        id: `${userId}-${w.chain}-${idx}`,
                        user_id: userId,
                        blockchain: w.chain,
                        wallet_address: w.address,
                        connected_at: w.connected_at
                    });
                });
            });
            // Optionally sort by connected_at descending
            flattened.sort((a, b) => (b.connected_at || '').localeCompare(a.connected_at || ''));
            return flattened;
        });
        return {
            status: 200,
            message: {
                message: "Wallets retrieved successfully",
                wallets: result
            }
        };
    }
    catch (error) {
        console.error("Error retrieving wallets:", error);
        // Fallback with mock data if MongoDB is unavailable
        const mockWallets = [
            {
                id: "mock-1",
                user_id: "user-1",
                blockchain: "ethereum",
                wallet_address: "0x1234...5678",
                connected_at: new Date().toISOString()
            },
            {
                id: "mock-2",
                user_id: "user-2",
                blockchain: "solana",
                wallet_address: "Sol123...xyz",
                connected_at: new Date().toISOString()
            }
        ];
        return {
            status: 200,
            message: {
                message: "Wallets retrieved successfully (fallback data - MongoDB unavailable)",
                wallets: mockWallets,
                fallback: true
            }
        };
    }
};
exports.default = getAllWallets;
