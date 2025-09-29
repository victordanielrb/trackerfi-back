import { Request } from 'express';
import mongo from '../../mongo';
import { toObjectId } from '../../utils/mongodb';

const getCampaignsByCreator = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
        const creatorId = req.params.creatorId;

        const objectId = toObjectId(creatorId);
        if (!objectId) {
            return { message: "Invalid creator ID", status: 400 };
        }

        // Verify creator exists
        const creator = await database.collection("users").findOne({ _id: objectId });
        if (!creator) {
            return { message: "Creator not found", status: 404 };
        }

        const campaigns = await database.collection("campaigns")
            .find({ creator_id: creatorId })
            .sort({ created_at: -1 })
            .toArray();

        const campaignsWithId = campaigns.map((campaign: any) => ({
            ...campaign,
            id: campaign._id.toString()
        }));

        return { message: campaignsWithId, status: 200 };
    } catch (error) {
        console.error("Error retrieving campaigns by creator:", error);
        return { message: "Error retrieving campaigns by creator", status: 500 };
    } finally {
        await client.close();
    }
};

export default getCampaignsByCreator;
