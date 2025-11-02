import mongo from '../../mongo';
import { toObjectId } from '../../utils/mongodb';

const deleteWallet = async (walletId: string): Promise<{ status: number; message: any }> => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("trackerfi");

        // Expect walletId in the format: <userId>-<chain>-<idx> (as returned by API)
        const parts = walletId.split('-');
        if (parts.length < 2) {
            return { status: 400, message: "Invalid wallet ID format" };
        }

        const userId = parts[0];
        const chain = parts[1];
        const idx = parts.length > 2 ? parseInt(parts[2], 10) : undefined;

        const objectId = toObjectId(userId);
        if (!objectId) {
            return { status: 400, message: "Invalid user ID in wallet ID" };
        }

        // Load user and find the wallet entry
        const user = await database.collection("users").findOne({ _id: objectId });
        if (!user) {
            return { status: 404, message: "User not found" };
        }

        const wallets = (user as any).wallets || [];
        let walletEntry: any = null;
        if (typeof idx === 'number' && !isNaN(idx)) {
            walletEntry = wallets[idx];
        } else {
            walletEntry = wallets.find((w: any) => String(w.chain) === chain);
        }

        if (!walletEntry) {
            return { status: 404, message: "Wallet not found" };
        }

        // Check if wallet is being used in any active campaigns or submissions
        const activeUsage = await database.collection("campaign_participants").findOne({
            user_id: userId,
            wallet_address: walletEntry.address
        });

        if (activeUsage) {
            return { 
                status: 409,
                message: "Cannot delete wallet that is being used in active campaigns"
            };
        }

        // Pull the wallet entry from the user's wallets array
        const result = await database.collection("users").updateOne(
            { _id: objectId },
            { $pull: { wallets: { address: walletEntry.address, chain: walletEntry.chain } } } as any
        );

        if (result.modifiedCount === 0) {
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

