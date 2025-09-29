import { Request } from 'express';
import mongo from "../../mongo";
import { CreatorUser, UserType, UserStatus } from "../../interfaces/user";

interface CreateCreatorUserRequest {
  twitter_id: string;
  twitter_username: string;
  twitter_display_name?: string;
  twitter_profile_image?: string;
  twitter_verified?: boolean;
  twitter_followers_count?: number;
  twitter_access_token?: string;
  twitter_refresh_token?: string;
}

export default async function createCreatorUser(req: Request<{}, {}, CreateCreatorUserRequest>) {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
        const usersCollection = database.collection("users");

        // Check if user already exists with this Twitter ID
        const existingUser = await usersCollection.findOne({ twitter_id: req.body.twitter_id });
        if (existingUser) {
            return { message: "User with this Twitter ID already exists", status: 409 };
        }

        // Create new creator user
        const newCreatorUser: Omit<CreatorUser, 'id'> = {
            username: req.body.twitter_username,
            user_type: UserType.CREATOR,
            twitter_id: req.body.twitter_id,
            twitter_username: req.body.twitter_username,
            twitter_display_name: req.body.twitter_display_name,
            twitter_profile_image: req.body.twitter_profile_image,
            twitter_verified: req.body.twitter_verified || false,
            twitter_followers_count: req.body.twitter_followers_count || 0,
            twitter_access_token: req.body.twitter_access_token,
            twitter_refresh_token: req.body.twitter_refresh_token,
            status: UserStatus.ACTIVE,
            total_earnings: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const result = await usersCollection.insertOne(newCreatorUser);
        
        return { 
            message: { 
                ...newCreatorUser, 
                id: result.insertedId.toString() 
            }, 
            status: 201 
        };
    } catch (error) {
        console.error("Error creating creator user:", error);
        return { message: "Error creating creator user", status: 500 };
    } finally {
        await client.close();
    }
}
