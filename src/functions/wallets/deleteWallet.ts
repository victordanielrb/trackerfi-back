import { Request } from 'express';
import mongo from '../../mongo';
import { toObjectId } from '../../utils/mongodb';

const deleteWallet = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
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

        // Check if wallet is being used in any active campaigns or submissions
        const activeUsage = await database.collection("campaign_participants").findOne({
            user_id: existingWallet.user_id,
            wallet_address: existingWallet.wallet_address
        });

        if (activeUsage) {
            return { 
                message: "Cannot delete wallet that is being used in active campaigns", 
                status: 400 
            };
        }

        const result = await database.collection("user_wallets").deleteOne({ _id: objectId });

        if (result.deletedCount === 0) {
            return { message: "Failed to delete wallet", status: 500 };
        }

        return { message: "Wallet deleted successfully", status: 200 };
    } catch (error) {
        console.error("Error deleting wallet:", error);
        return { message: "Error deleting wallet", status: 500 };
    } finally {
        await client.close();
    }
};

export default deleteWallet;

