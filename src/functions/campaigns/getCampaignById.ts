import { Request, Response } from 'express';
import mongo from "../../mongo";
import { toObjectId } from '../../utils/mongodb';

export default async function getCampaignById(req: Request, res: Response): Promise<Response> {
    const client = mongo();

    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            return res.status(400).json({ error: 'Invalid campaign ID' });
        }

        await client.connect();
        const campaign = await client.db("bounties").collection("campaigns").findOne({ _id: objectId });
        
        if (!campaign) {
            return res.status(404).json({ error: "Campaign not found" });
        }
        
        return res.status(200).json(campaign);
    } catch (error) {
        console.error("Error fetching campaign:", error);
        return res.status(500).json({ error: "Internal server error" });
    } finally {
        await client.close();
    }
}
