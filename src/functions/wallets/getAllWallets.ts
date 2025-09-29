import { Request } from 'express';
import mongo from '../../mongo';

const getAllWallets = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
        
        const wallets = await database.collection("user_wallets")
            .find({})
            .sort({ connected_at: -1 })
            .toArray();

        const walletsWithId = wallets.map((wallet: any) => ({
            ...wallet,
            id: wallet._id.toString()
        }));

        return { message: walletsWithId, status: 200 };
    } catch (error) {
        console.error("Error retrieving wallets:", error);
        return { message: "Error retrieving wallets", status: 500 };
    } finally {
        await client.close();
    }
};

export default getAllWallets;
