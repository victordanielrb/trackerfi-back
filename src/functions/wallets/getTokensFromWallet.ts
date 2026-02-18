import { log } from "console";
import { getDb } from "../../mongo";
import TokensFromWallet from "../../interfaces/tokenInterface";

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    authorization: 'Basic '+process.env.ZERION_API_KEY_HASH
  }
};

export default async function getTokensFromWallet(wallet: string) {
  const db = await getDb();

  // Check for cached wallet tokens in users collection. If the wallet has tokens and
  // the wallet.updated_at is within the last 5 minutes, return that cached snapshot.
  try {
    const usersColl = db.collection('users');
    const userWithWallet = await usersColl.findOne({ "wallets.address": wallet }, { projection: { wallets: { $elemMatch: { address: wallet } } } });
    const cachedWallet = userWithWallet?.wallets?.[0];
    if (cachedWallet && cachedWallet.tokens && cachedWallet.updated_at) {
      const updatedAt = Date.parse(cachedWallet.updated_at);
      const ageMs = Date.now() - updatedAt;
      const FIVE_MIN = 5 * 60 * 1000;
      if (ageMs <= FIVE_MIN) {
        // Return cached tokens without calling external API
        console.log(`Returning cached tokens for wallet ${wallet} (age ${Math.round(ageMs/1000)}s)`);
        try {
          console.log('Cached wallet tokens:', JSON.stringify(cachedWallet.tokens, null, 2));
        } catch (e) {
          console.log('Cached wallet tokens (stringify failed):', cachedWallet.tokens);
        }
        return cachedWallet.tokens as TokensFromWallet[];
      }
    }
  } catch (cacheErr) {
    console.warn('Error checking token cache for wallet', wallet, cacheErr);
  }
  const response = await fetch(`https://api.zerion.io/v1/wallets/${wallet}/positions/?filter[positions]=only_simple&currency=usd&filter[trash]=only_non_trash&sort=value`, options);
  const data = await response.json();

  const tokens: TokensFromWallet[] = [];
  const userTokens: Partial<TokensFromWallet>[] = [];

  data.data.forEach((element: any) => {
    let [idAddress, chain] = element.id.split('-');
    idAddress === "base"? idAddress = "0x0000000000000000000000000000000000000000": idAddress = idAddress;
    const contractAddress = idAddress;

    // Better chain extraction and mapping - PRESERVE SPECIFIC CHAIN NAMES
    const chainName = chain || 'unknown';

    const displayChain = chainName.toUpperCase();

    // Extract price and balance information with better fallbacks
    const quantity = element.attributes.quantity?.float || parseFloat(element.attributes.quantity) || 0;
    const value = element.attributes.value || 0;
    const price = element.attributes.price || 0;
    const changes = element.attributes.changes || {};
    const change24h = changes['24h'] || changes.absolute_1d || 0;

    const tokenInfo = {
      id: element.id,
      name: element.attributes.fungible_info?.name || 'Unknown',
      symbol: element.attributes.fungible_info?.symbol || 'Unknown',
      address: contractAddress,
      chain: displayChain,
      position_type: element.attributes.position_type,
      // Price and balance information
      price: price,
      quantity: quantity,
      value: value, // USD value
      price_change_24h: change24h,
      // Additional metadata
      decimals: element.attributes.fungible_info?.decimals || 18,
      icon_url: element.attributes.fungible_info?.icon?.url || null,
      updated_at: new Date().toISOString()
    };

    // Debug logging
    console.log(`Token: ${tokenInfo.symbol}, Quantity: ${quantity}, Price: ${price}, Value: ${value}, Change24h: ${change24h}, Chain: ${displayChain}`);

  tokens.push(tokenInfo as TokensFromWallet);

    // Store user-specific token data
    userTokens.push({
      id: element.id,
      quantity: quantity,
      value: value,
      price: price,
      price_change_24h: change24h,
      updated_at: new Date().toISOString()
    });
  });
  try {
    // compute wallet-level 24h change (absolute USD) and percent
    const totalValue = userTokens.reduce((s, tk) => s + (parseFloat(tk.value as any) || 0), 0);
    const totalChange = userTokens.reduce((s, tk) => s + ((parseFloat(tk.value as any) || 0) * (parseFloat(tk.price_change_24h as any) || 0)), 0);
    const percentChange = totalValue !== 0 ? (totalChange / totalValue) : 0;

    // Store wallet token snapshot and 24h change inside the users collection.
    // We expect `users.wallets` to be an array of objects { address, chain, ... }.
    // Update the specific wallet entry when present, otherwise upsert a minimal user document
    // with a wallet object that includes the token snapshot.
    const usersColl = db.collection("users");

    // First try to update an existing wallet entry using the positional $ operator
    const updateRes = await usersColl.updateOne(
      { "wallets.address": wallet },
      {
        $set: {
          // Store full token objects in the wallet snapshot so cached reads include name/symbol/address
          "wallets.$.tokens": tokens,
          "wallets.$.wallet_24h_change": totalChange,
          "wallets.$.wallet_24h_change_percent": percentChange,
          "wallets.$.updated_at": new Date().toISOString(),
        }
      }
    );

    // If no wallet entry matched (wallet not tracked yet in users), create a minimal user document
    // by upserting a document that contains the wallet as an object (not a plain string) so other
    // parts of the code that query by `wallets.address` keep working.
    if (updateRes.matchedCount === 0) {
      await usersColl.updateOne(
        { "wallets.address": wallet },
        {
          $setOnInsert: {
            name: null,
            email: null,
            wallets: [
              {
                address: wallet,
                chain: (tokens[0]?.chain as string) ? (tokens[0]!.chain as string) : 'UNKNOWN',
                connected_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                tokens: tokens,
                wallet_24h_change: totalChange,
                wallet_24h_change_percent: percentChange
              }
            ]
          }
        },
        { upsert: true }
      );
    }

    // Use bulkWrite for tokens instead of updateMany
    if (tokens.length > 0) {
      const bulkOps = tokens.map(token => ({
        updateOne: {
          filter: { id: token.id },
          update: { $set: token },
          upsert: true
        }
      }));

      await db.collection("tokens").bulkWrite(bulkOps, { ordered: false });
    }
  } catch (error) {
    console.error("Error updating database:", error);
  }
  return tokens;
}
