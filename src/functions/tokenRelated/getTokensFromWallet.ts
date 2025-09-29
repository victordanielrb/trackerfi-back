import { log } from "console";
import mongo from "../../mongo";
import { MongoClient } from "mongodb";

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    authorization: 'Basic emtfZGV2XzMxMmQ1ZTdlODNhYzQ4YzNhZmYxMDQ5ODFkNjQ5MWMwOlNvcnRlaW8xMg=='
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
    
   
      let [idAddress] = element.id.split('-');
      idAddress === "base"? idAddress = "0x0000000000000000000000000000000000000000": idAddress = idAddress;
      const contractAddress = idAddress;
    

    tokens.push({
      id: element.id,
      name: element.attributes.fungible_info?.name || 'Unknown',
      symbol: element.attributes.fungible_info?.symbol || 'Unknown',
      address: contractAddress,
      chain: element.id.split('-')[1] || 'unknown',
      position_type: element.attributes.position_type
    });
    userTokens.push({
     id : element.id,
     quantity: element.attributes.quantity,
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
