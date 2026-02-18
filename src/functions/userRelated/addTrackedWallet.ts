import { ObjectId } from "mongodb";
import { getDb } from "../../mongo";

export default async function addTrackedWallet(
  userId: string,
  walletAddress: string,
  chain: string
) {
  try {
    const db = await getDb();

    // Check if wallet is already tracked by this user in the users collection
    const existingUser = await db.collection("users").findOne({
      _id: new ObjectId(userId),
      "wallets.address": walletAddress,
      "wallets.chain": chain
    });

    if (existingUser) {
      throw new Error("Wallet already tracked by this user");
    }

    // Add wallet to user's tracked wallets in the users collection
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $addToSet: {
          wallets: {
            address: walletAddress,
            chain: chain
          }
        }
      }
    );

    if (result.matchedCount === 0) {
      throw new Error("User not found");
    }

    return { success: true, message: "Wallet added to tracking list" };
  } catch (error) {
    console.error("Error adding tracked wallet:", error);
    throw error;
  }
}
