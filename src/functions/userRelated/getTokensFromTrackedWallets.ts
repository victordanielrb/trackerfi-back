import { ObjectId } from "mongodb";
import { getDb } from "../../mongo";
import getTokensFromWallet from "../wallets/getTokensFromWallet";

export default async function getTokensFromTrackedWallets(
  userId: string
) {
  try {
    const db = await getDb();

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
        const tokens = await getTokensFromWallet(wallet.address);

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
  }
}
