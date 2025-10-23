import { Request } from 'express';
import mongo from '../../mongo';
import { toObjectId } from '../../utils/mongodb';

const updateWallet = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("trackerfi");
                const walletId = req.params.id;

        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            return { message: "Invalid wallet ID", status: 400 };
        }

        // Check if wallet exists
        const existingWallet = await database.collection("user_wallets").findOne({ _id: objectId });
        if (!existingWallet) {
            return { message: "Wallet not found", status: 404 };
        }

        // Prepare update data
        const updateData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };

        // Remove fields that shouldn't be updated directly
        delete updateData.id;
        delete updateData._id;
        delete updateData.user_id;
        delete updateData.blockchain;
        delete updateData.connected_at;

        const result = await database.collection("user_wallets").updateOne(
            { _id: objectId },
            { $set: updateData }
        );

        if (result.modifiedCount === 0) {
            return { message: "No changes made to wallet", status: 200 };
        }

        return { message: "Wallet updated successfully", status: 200 };
    } catch (error) {
        console.error("Error updating wallet:", error);
        return { message: "Error updating wallet", status: 500 };
    } finally {
        await client.close();
    }
};

export default updateWallet;

