import { Request, Response } from 'express';
import mongo from "../../mongo";
import { toObjectId } from '../../utils/mongodb';

export default async function setCampaignLeaderboard(req: Request, res: Response): Promise<Response> {
    const client = mongo();

    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            return res.status(400).json({ error: 'Invalid campaign ID' });
        }

        await client.connect();
        const database = client.db("bounties");
        
        const result = await database.collection("campaigns").updateOne(
            { _id: objectId },
            { $set: { leaderboard: req.body.leaderboard } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Campaign not found" });
        }
        
        return res.status(200).json({ message: "Leaderboard updated successfully" });
    } catch (error) {
        console.error("Error updating campaign leaderboard:", error);
        return res.status(500).json({ error: "Internal server error" });
    } finally {
        await client.close();
    }
}
