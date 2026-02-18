import TokensFromWallet from "../../interfaces/tokenInterface";
import { getDb } from "../../mongo";


export default async function setTokenData(tokens: TokensFromWallet[]) {
    try {
        const db = await getDb();
        const collection = db.collection('tokens');
        tokens.forEach(async (token) => {
            const filter = { address: token.address, chain: token.chain };
            const update = { $set: token };
            const options = { upsert: true };
            await collection.updateOne(filter, update, options);
        });
        console.log('Tokens inserted/updated successfully');
    } catch (err) {
        console.error('Error connecting to MongoDB', err);
    }
}
