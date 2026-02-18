import { ObjectId } from "mongodb";
import { getDb } from "../../mongo";

export default async function getUserTrackedWallets(
  userId: string
) {
  try {
    const db = await getDb();

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      { projection: { wallets: 1 } }
    );

    if (!user) {
      throw new Error("User not found");
    }

    return user.wallets || [];
  } catch (error) {
    console.error("Error getting user tracked wallets:", error);
    throw error;
  }
}
