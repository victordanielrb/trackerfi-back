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

        // Check if user exists in the login_users collection
        const user = await database.collection("login_users").findOne({ _id: objectId });
        if (!user) {
            return { status: 404, message: "User not found" };
        }

        const wallets = await database.collection("user_wallets")
            .find({ user_id: userId })
            .sort({ connected_at: -1 })
            .toArray();

        const walletsWithId = wallets.map(wallet => ({
            id: wallet._id.toString(),
            user_id: wallet.user_id,
            blockchain: wallet.blockchain,
            wallet_address: wallet.wallet_address,
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