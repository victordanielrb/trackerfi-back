import { Request } from 'express';
import mongo from '../../mongo';
import { toObjectId } from '../../utils/mongodb';

const updateLeaderboard = async (req: Request) => {
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

        // Prepare update data
        const updateData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };

        // Remove fields that shouldn't be updated directly
        delete updateData.id;
        delete updateData._id;
        delete updateData.calculated_at;

        const result = await database.collection("leaderboards").updateOne(
            { _id: objectId },
            { $set: updateData }
        );

        if (result.modifiedCount === 0) {
            return { message: "No changes made to leaderboard entry", status: 200 };
        }

        return { message: "Leaderboard entry updated successfully", status: 200 };
    } catch (error) {
        console.error("Error updating leaderboard entry:", error);
        return { message: "Error updating leaderboard entry", status: 500 };
    } finally {
        await client.close();
    }
};

export default updateLeaderboard;


