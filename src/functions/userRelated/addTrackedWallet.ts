import { MongoClient, ObjectId } from "mongodb";
import mongo from "../../mongo";

export default async function addTrackedWallet(
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
    
    // Check if wallet is already tracked by this user
    const existingUser = await db.collection("login_users").findOne({
      _id: new ObjectId(userId),
      "wallets.address": walletAddress,
      "wallets.chain": chain
    });

    if (existingUser) {
      throw new Error("Wallet already tracked by this user");
    }

    // Add wallet to user's tracked wallets
    const result = await db.collection("login_users").updateOne(
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
  } finally {
    if (shouldCloseClient && client) {
      await client.close();
    }
  }
}
