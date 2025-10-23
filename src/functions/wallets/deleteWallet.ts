import mongo from '../../mongo';
import { toObjectId } from '../../utils/mongodb';

const deleteWallet = async (walletId: string): Promise<{ status: number; message: any }> => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("trackerfi");

        const objectId = toObjectId(walletId);
        if (!objectId) {
            return { status: 400, message: "Invalid wallet ID" };
        }

        // Check if wallet exists
        const existingWallet = await database.collection("user_wallets").findOne({ _id: objectId });
        if (!existingWallet) {
            return { status: 404, message: "Wallet not found" };
        }

        // Check if wallet is being used in any active campaigns or submissions
        const activeUsage = await database.collection("campaign_participants").findOne({
            user_id: existingWallet.user_id,
            wallet_address: existingWallet.wallet_address
        });

        if (activeUsage) {
            return { 
                status: 409,
                message: "Cannot delete wallet that is being used in active campaigns"
            };
        }

        const result = await database.collection("user_wallets").deleteOne({ _id: objectId });

        if (result.deletedCount === 0) {
            return { status: 400, message: "Failed to delete wallet" };
        }

        return { status: 200, message: { message: "Wallet deleted successfully", deletedId: walletId } };
    } catch (error) {
        console.error("Error deleting wallet:", error);
        return { status: 500, message: "Error deleting wallet" };
    } finally {
        await client.close();
    }
};

export default deleteWallet;

