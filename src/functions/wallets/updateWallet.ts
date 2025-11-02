import { Request } from 'express';
import mongo from '../../mongo';
import { toObjectId } from '../../utils/mongodb';

const updateWallet = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("trackerfi");
                const walletId = req.params.id;

                // Expect walletId in the format: <userId>-<chain>-<idx>
                const parts = walletId.split('-');
                if (parts.length < 2) {
                    return { message: "Invalid wallet ID format", status: 400 };
                }

                const userId = parts[0];
                const chain = parts[1];
                const idx = parts.length > 2 ? parseInt(parts[2], 10) : undefined;

                const objectId = toObjectId(userId);
                if (!objectId) {
                    return { message: "Invalid user ID in wallet ID", status: 400 };
                }

                // Load user and find wallet entry
                const user = await database.collection("users").findOne({ _id: objectId });
                if (!user) {
                    return { message: "User not found", status: 404 };
                }

                const wallets = (user as any).wallets || [];
                let walletEntry: any = null;
                if (typeof idx === 'number' && !isNaN(idx)) {
                    walletEntry = wallets[idx];
                } else {
                    walletEntry = wallets.find((w: any) => String(w.chain) === chain);
                }

                if (!walletEntry) {
                    return { message: "Wallet not found", status: 404 };
                }

                // Only allow updating the wallet address (and updated_at). Changing chain is not supported here.
                const { wallet_address } = req.body as any;
                if (!wallet_address) {
                    return { message: "wallet_address is required for update", status: 400 };
                }

                const now = new Date().toISOString();

                const result = await database.collection("users").updateOne(
                    { _id: objectId, "wallets.chain": walletEntry.chain, "wallets.address": walletEntry.address },
                    { $set: { "wallets.$.address": wallet_address, "wallets.$.updated_at": now } } as any
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

