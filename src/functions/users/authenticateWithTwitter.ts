import { Request } from 'express';
import mongo from "../../mongo";
import { CreatorUser, UserType } from "../../interfaces/user";
import createCreatorUser from "./createCreatorUser";

interface TwitterAuthRequest {
  twitter_id: string;
  twitter_username: string;
  twitter_display_name?: string;
  twitter_profile_image?: string;
  twitter_verified?: boolean;
  twitter_followers_count?: number;
  twitter_access_token: string;
  twitter_refresh_token?: string;
}

export default async function authenticateWithTwitter(req: Request<{}, {}, TwitterAuthRequest>) {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
        const usersCollection = database.collection("users");

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ 
            twitter_id: req.body.twitter_id,
            user_type: UserType.CREATOR
        });

        if (existingUser) {
            // Update existing user with new token information
            const updateData = {
                twitter_username: req.body.twitter_username,
                twitter_display_name: req.body.twitter_display_name,
                twitter_profile_image: req.body.twitter_profile_image,
                twitter_verified: req.body.twitter_verified,
                twitter_followers_count: req.body.twitter_followers_count,
                twitter_access_token: req.body.twitter_access_token,
                twitter_refresh_token: req.body.twitter_refresh_token,
                updated_at: new Date().toISOString(),
            };

            await usersCollection.updateOne(
                { _id: existingUser._id },
                { $set: updateData }
            );

            return {
                message: {
                    ...existingUser,
                    ...updateData,
                    id: existingUser._id.toString()
                },
                status: 200,
                isNewUser: false
            };
        } else {
            // Create new user
            const createUserReq = {
                ...req,
                body: {
                    ...req.body,
                    user_type: UserType.CREATOR
                }
            };

            const result = await createCreatorUser(createUserReq as any);
            return {
                ...result,
                isNewUser: true
            };
        }
    } catch (error) {
        console.error("Error authenticating with Twitter:", error);
        return { message: "Error authenticating with Twitter", status: 500 };
    } finally {
        await client.close();
    }
}
