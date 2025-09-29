import { Request } from 'express';
import mongo from '../../mongo';

const getLeaderboard = async (req: Request) => {
    const client = mongo();
    try {
        const { id: campaignId } = req.params;
        
        await client.connect();
        const database = client.db("bounties");
        
        const leaderboard = await database.collection("leaderboards")
            .find({ campaign_id: campaignId })
            .sort({ position: 1 })
            .toArray();
        
        // Agregar informações do usuário
        const enrichedLeaderboard = await Promise.all(
            leaderboard.map(async (entry: any) => {
                const user = await database.collection("users").findOne({ _id: entry.user_id });
                return {
                    ...entry,
                    user: user ? { username: user.username, id: user._id } : null
                };
            })
        );
        
        return { message: enrichedLeaderboard, status: 200 };
    } catch (error) {
        console.error("Error retrieving leaderboard:", error);
        return { message: "Error retrieving leaderboard", status: 500 };
    } finally {
        await client.close();
    }
};

export default getLeaderboard;
