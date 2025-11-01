import { log } from "console";
import mongo from "../../mongo";
import { MongoClient } from "mongodb";

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    authorization: 'Basic '+process.env.ZERION_API_KEY_HASH
  }
};

export default async function getTokensFromWallet(wallet: string, client?: MongoClient) {
  let shouldCloseClient = false;
  
  if (!client) {
    client = mongo();
    shouldCloseClient = true;
  }
  const response = await fetch(`https://api.zerion.io/v1/wallets/${wallet}/positions/?filter[positions]=only_simple&currency=usd&filter[trash]=only_non_trash&sort=value`, options);
  const data = await response.json();

  const tokens: any[] = [];
  const userTokens: any[] = [];

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

    tokens.push(tokenInfo);
    
    // Store user-specific token data
    userTokens.push({
      id: element.id,
      quantity: quantity,
      value: value,
      price: price,
      updated_at: new Date().toISOString()
    });
  });
  try {
    await client!.db("trackerfi").collection("user").updateOne(
      { wallet: wallet },
      { $set: { tokens: [...userTokens] } },
      { upsert: true }
    );
    
    // Use bulkWrite for tokens instead of updateMany
    if (tokens.length > 0) {
      const bulkOps = tokens.map(token => ({
        updateOne: {
          filter: { id: token.id },
          update: { $set: token },
          upsert: true
        }
      }));

      await client!.db("trackerfi").collection("tokens").bulkWrite(bulkOps, { ordered: false });
    }
  } catch (error) {
    console.error("Error updating database:", error);
  }
  finally {
    if (shouldCloseClient && client) {
      await client.close();
    }
  }
  return tokens;
}
