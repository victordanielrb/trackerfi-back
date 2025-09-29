import { Request } from 'express';
import mongo from '../../mongo';
import { toObjectId } from '../../utils/mongodb';

const deleteLeaderboard = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
        const leaderboardId = req.params.id;

        const objectId = toObjectId(leaderboardId);
        if (!objectId) {
            return { message: "Invalid leaderboard ID", status: 400 };
        }

        // Check if leaderboard entry exists
        const existingLeaderboard = await database.collection("leaderboards").findOne({ _id: objectId });
        if (!existingLeaderboard) {
            return { message: "Leaderboard entry not found", status: 404 };
        }

        // Check if rewards have been distributed
        if (existingLeaderboard.reward_status === 'PAID') {
            return { message: "Cannot delete leaderboard entry with paid rewards", status: 400 };
        }

        const result = await database.collection("leaderboards").deleteOne({ _id: objectId });

        if (result.deletedCount === 0) {
            return { message: "Failed to delete leaderboard entry", status: 500 };
        }

        return { message: "Leaderboard entry deleted successfully", status: 200 };
    } catch (error) {
        console.error("Error deleting leaderboard entry:", error);
        return { message: "Error deleting leaderboard entry", status: 500 };
    } finally {
        await client.close();
    }
};

export default deleteLeaderboard;

