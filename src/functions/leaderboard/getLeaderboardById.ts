import { Request } from 'express';
import mongo from '../../mongo';
import { toObjectId } from '../../utils/mongodb';

const getLeaderboardById = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
        const leaderboardId = req.params.id;

        const objectId = toObjectId(leaderboardId);
        if (!objectId) {
            return { message: "Invalid leaderboard ID", status: 400 };
        }

        const leaderboard = await database.collection("leaderboards").findOne({ _id: objectId });
        
        if (!leaderboard) {
            return { message: "Leaderboard entry not found", status: 404 };
        }

        return { 
            message: {
                ...leaderboard,
                id: leaderboard._id.toString()
            }, 
            status: 200 
        };
    } catch (error) {
        console.error("Error retrieving leaderboard entry:", error);
        return { message: "Error retrieving leaderboard entry", status: 500 };
    } finally {
        await client.close();
    }
};

export default getLeaderboardById;

