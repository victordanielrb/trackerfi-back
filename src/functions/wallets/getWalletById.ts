import { Request } from 'express';
import mongo from '../../mongo';
import { toObjectId } from '../../utils/mongodb';

const getWalletById = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
                const walletId = req.params.id;

        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            return { message: "Invalid wallet ID", status: 400 };
        }

        const wallet = await database.collection("user_wallets").findOne({ _id: objectId });
        
        if (!wallet) {
            return { message: "Wallet not found", status: 404 };
        }

        return { 
            message: {
                ...wallet,
                id: wallet._id.toString()
            }, 
            status: 200 
        };
    } catch (error) {
        console.error("Error retrieving wallet:", error);
        return { message: "Error retrieving wallet", status: 500 };
    } finally {
        await client.close();
    }
};

export default getWalletById;


