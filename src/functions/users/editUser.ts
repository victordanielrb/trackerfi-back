import { Request } from 'express';
import mongo from "../../mongo";
import { UserType } from "../../interfaces/user";
import { toObjectId } from '../../utils/mongodb';

export default async function editUser(req: Request) {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
        const usersCollection = database.collection("users");
        
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            return { message: "Invalid user ID format", status: 400 };
        }
        
        // Get the current user to validate the update
        const currentUser = await usersCollection.findOne({ _id: objectId });
        if (!currentUser) {
            return { message: "User not found", status: 404 };
        }

        // Prepare update data with timestamp
        const updateData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };

        // Remove sensitive fields that shouldn't be updated directly
        delete updateData.id;
        delete updateData._id;
        delete updateData.created_at;
        
        // Validate user type specific updates
        if (currentUser.user_type === UserType.CREATOR) {
            // For creators, only allow updating specific fields
            const allowedFields = [
                'twitter_username', 'twitter_display_name', 'twitter_profile_image',
                'twitter_verified', 'twitter_followers_count', 'status', 'updated_at'
            ];
            Object.keys(updateData).forEach(key => {
                if (!allowedFields.includes(key)) {
                    delete updateData[key];
                }
            });
        } else if (currentUser.user_type === UserType.HOST) {
            // For hosts, only allow updating specific fields
            const allowedFields = [
                'username', 'email', 'discord_id', 'google_id', 'email_verified',
                'status', 'total_earnings', 'updated_at'
            ];
            Object.keys(updateData).forEach(key => {
                if (!allowedFields.includes(key)) {
                    delete updateData[key];
                }
            });
        }

        const result = await usersCollection.updateOne(
            { _id: objectId }, 
            { $set: updateData }
        );
        
        return { message: result, status: 200 };
    } catch (error) {
        console.error("Error editing user:", error);
        return { message: "Error editing user", status: 500 };
    } finally {
        await client.close();
    }
}
