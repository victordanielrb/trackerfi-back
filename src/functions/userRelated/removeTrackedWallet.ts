import { ObjectId } from "mongodb";
import { getDb } from "../../mongo";

export default async function removeTrackedWallet(
  userId: string,
  walletAddress: string,
  chain: string
) {
  try {
    const db = await getDb();

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $pull: {
          wallets: {
            address: walletAddress,
            chain: chain
          }
        }
      } as any
    );

    if (result.matchedCount === 0) {
      throw new Error("User not found");
    }

    if (result.modifiedCount === 0) {
      throw new Error("Wallet not found in tracking list");
    }

    return { success: true, message: "Wallet removed from tracking list" };
  } catch (error) {
    console.error("Error removing tracked wallet:", error);
    throw error;
  }
}
