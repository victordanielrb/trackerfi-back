import { Request } from 'express';
import mongo from '../../mongo';
import { toObjectId } from '../../utils/mongodb';

const getUserById = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
        const userId = req.params.id;

        const objectId = toObjectId(userId);
        if (!objectId) {
            return { message: "Invalid user ID format", status: 400 };
        }

        const user = await database.collection("users").findOne({ _id: objectId });
        
        if (!user) {
            return { message: "User not found", status: 404 };
        }

        // Remove sensitive information
        const { password_hash, temp_password, twitter_access_token, twitter_refresh_token, ...sanitizedUser } = user;
        
        return { 
            message: {
                ...sanitizedUser,
                id: user._id.toString()
            }, 
            status: 200 
        };
    } catch (error) {
        console.error("Error retrieving user:", error);
        return { message: "Error retrieving user", status: 500 };
    } finally {
        await client.close();
    }
};

export default getUserById;
