import { Request  } from 'express';
import mongo from '../../mongo';

const getAllUsers = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
        const users = await database.collection("users").find({}).toArray();
        
        // Remove sensitive information before returning
        const sanitizedUsers = users.map((user: any) => {
            const { password_hash, temp_password, twitter_access_token, twitter_refresh_token, ...sanitizedUser } = user;
            return {
                ...sanitizedUser,
                id: user._id.toString()
            };
        });

        return { message: sanitizedUsers, status: 200 };
    } catch (error) {
        console.error("Error retrieving users:", error);
        return { message: "Error retrieving users", status: 500 };
    } finally {
        await client.close();
    }
};

export default getAllUsers;
