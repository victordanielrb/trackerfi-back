import { MongoClient, ObjectId } from "mongodb";
import mongo from "../../mongo";
import getTokensFromWallet from "../tokenRelated/getTokensFromWallet";

export default async function getTokensFromTrackedWallets(
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
    
    // Get user's tracked wallets from the `users` collection
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      { projection: { wallets: 1 } }
    );

    if (!user || !user.wallets) {
      return [];
    }

    const allTokens = [];

    // Get tokens for each tracked wallet
    for (const wallet of user.wallets) {
      try {
        const tokens = await getTokensFromWallet(wallet.address, client);
        
        // Add wallet info to each token
        const tokensWithWallet = tokens.map((token: any) => ({
          ...token,
          wallet_address: wallet.address,
          wallet_chain: wallet.chain
        }));
        
        allTokens.push(...tokensWithWallet);
      } catch (error) {
        console.error(`Error fetching tokens for wallet ${wallet.address}:`, error);
        // Continue with other wallets even if one fails
      }
    }

    return allTokens;
  } catch (error) {
    console.error("Error getting tokens from tracked wallets:", error);
    throw error;
  } finally {
    if (shouldCloseClient && client) {
      await client.close();
    }
  }
}
