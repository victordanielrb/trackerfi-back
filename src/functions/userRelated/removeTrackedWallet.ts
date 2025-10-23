import { MongoClient, ObjectId } from "mongodb";
import mongo from "../../mongo";

export default async function removeTrackedWallet(
  userId: string, 
  walletAddress: string, 
  chain: string, 
  client?: MongoClient
) {
  let shouldCloseClient = false;
  
  if (!client) {
    client = mongo();
    shouldCloseClient = true;
  }

  try {
    const db = client.db("trackerfi");
    
    const result = await db.collection("login_users").updateOne(
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
  } finally {
    if (shouldCloseClient && client) {
      await client.close();
    }
  }
}
