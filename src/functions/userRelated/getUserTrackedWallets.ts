import { MongoClient, ObjectId } from "mongodb";
import mongo from "../../mongo";

export default async function getUserTrackedWallets(
  userId: string, 
  client?: MongoClient
) {
  let shouldCloseClient = false;
  
  if (!client) {
    client = mongo();
    shouldCloseClient = true;
  }

  try {
    const db = client.db("trackerfi");
    
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
  } finally {
    if (shouldCloseClient && client) {
      await client.close();
    }
  }
}
