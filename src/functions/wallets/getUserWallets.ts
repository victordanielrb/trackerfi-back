import { Request } from 'express';
import mongo from '../../mongo';
import { toObjectId } from '../../utils/mongodb';

const getUserWallets = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("trackerfi");

        const userId = req.params.userId;
        const objectId = toObjectId(userId);
        if (!objectId) {
            return { status: 400, message: "Invalid user ID" };
        }

        // Check if user exists in the users collection and read embedded wallets
        const user = await database.collection("users").findOne({ _id: objectId });
        if (!user) {
            return { status: 404, message: "User not found" };
        }

        const wallets = (user as any).wallets || [];

        const walletsWithId = (wallets as any[]).map((wallet, idx) => ({
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
    } catch (error) {
        console.error("Error retrieving user wallets:", error);
        return { status: 500, message: "Error retrieving user wallets" };
    } finally {
        await client.close();
    }
};

export default getUserWallets;