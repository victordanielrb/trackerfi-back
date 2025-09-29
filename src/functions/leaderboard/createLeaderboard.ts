import { Request } from 'express';
import mongo from '../../mongo';
import { LeaderboardRewardStatus } from '../../interfaces/leaderboard';

const createLeaderboard = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
        
        const {
            campaign_id,
            user_id,
            position,
            total_points,
            reward_amount_usd,
            payment_notes
        } = req.body;

        // Validate required fields
        if (!campaign_id || !user_id || !position || total_points === undefined || reward_amount_usd === undefined) {
            return { message: "Missing required fields", status: 400 };
        }

        // Check if campaign exists
        const campaign = await database.collection("campaigns").findOne({ _id: campaign_id });
        if (!campaign) {
            return { message: "Campaign not found", status: 404 };
        }

        // Check if user exists
        const user = await database.collection("users").findOne({ _id: user_id });
        if (!user) {
            return { message: "User not found", status: 404 };
        }

        // Check if leaderboard entry already exists for this user and campaign
        const existingEntry = await database.collection("leaderboards").findOne({
            campaign_id,
            user_id
        });

        if (existingEntry) {
            return { message: "Leaderboard entry already exists for this user and campaign", status: 409 };
        }

        const newLeaderboard = {
            campaign_id,
            user_id,
            position,
            total_points,
            reward_amount_usd,
            reward_status: LeaderboardRewardStatus.PENDING,
            payment_notes: payment_notes || '',
            calculated_at: new Date().toISOString()
        };

        const result = await database.collection("leaderboards").insertOne(newLeaderboard);
        
        return { 
            message: {
                id: result.insertedId.toString(),
                ...newLeaderboard
            }, 
            status: 201 
        };
    } catch (error) {
        console.error("Error creating leaderboard entry:", error);
        return { message: "Error creating leaderboard entry", status: 500 };
    } finally {
        await client.close();
    }
};

export default createLeaderboard;
