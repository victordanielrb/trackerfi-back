import { Request } from 'express';
import mongo from '../../mongo';
import { UserType } from '../../interfaces/user';

const getUsersByType = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
        const userType = req.params.userType as UserType;

        // Validate user type
        if (!Object.values(UserType).includes(userType)) {
            return { message: "Invalid user type", status: 400 };
        }

        const users = await database.collection("users").find({ user_type: userType }).toArray();
        
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
        console.error("Error retrieving users by type:", error);
        return { message: "Error retrieving users by type", status: 500 };
    } finally {
        await client.close();
    }
};

export default getUsersByType;
