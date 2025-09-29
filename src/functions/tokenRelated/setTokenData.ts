import TokensFromWallet from "../../interfaces/tokenInterface";
import mongo from "../../mongo";


export default function setTokenData(tokens: TokensFromWallet[]) {
    const client = mongo();
    client.connect().then(() => {
        const db = client.db('trackfi');
        const collection = db.collection('tokens');
        tokens.forEach(async (token) => {
            const filter = { address: token.address, chain: token.chain };
            const update = { $set: token };
            const options = { upsert: true };
            await collection.updateOne(filter, update, options);
        });
        console.log('Tokens inserted/updated successfully');
        client.close();
    }).catch((err) => {
        console.error('Error connecting to MongoDB', err);
        client.close(); 
    });
}
