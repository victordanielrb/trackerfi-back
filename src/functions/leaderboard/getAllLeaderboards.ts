import { Request } from 'express';
import mongo from '../../mongo';

const getAllLeaderboards = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
        
        const leaderboards = await database.collection("leaderboards")
            .find({})
            .sort({ calculated_at: -1 })
            .toArray();

        const leaderboardsWithId = leaderboards.map((leaderboard: any) => ({
            ...leaderboard,
            id: leaderboard._id.toString()
        }));

        return { message: leaderboardsWithId, status: 200 };
    } catch (error) {
        console.error("Error retrieving leaderboards:", error);
        return { message: "Error retrieving leaderboards", status: 500 };
    } finally {
        await client.close();
    }
};

export default getAllLeaderboards;
