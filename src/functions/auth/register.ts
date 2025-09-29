
import { BaseUser, HostUser } from "../../interfaces";
import mongo from "../../mongo";
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // Higher number = more secure but slower

export default async function register(user: HostUser & { password: string }): Promise<{ message: string; status: number; userId?: string }> {
    const client = mongo();
    
    try {
        await client.connect();
        const database = client.db("bounties");
        const usersCollection = database.collection("users");

        // Check if user already exists
        const existingUser = await usersCollection.findOne({
            $or: [
                { email: user.email },
                { username: user.username }
            ]
        });

        if (existingUser) {
            return { message: "User with this email or username already exists", status: 409 };
        }

        // Hash the password before storing
        const password_hash = await bcrypt.hash(user.password, SALT_ROUNDS);
        
        // Create user object without plain password
        const { password, ...userWithoutPassword } = user;
        const userToStore = {
            ...userWithoutPassword,
            password_hash,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const result = await usersCollection.insertOne(userToStore);

        if (!result.insertedId) {
            return { message: "Error registering user", status: 500 };
        }

        return { 
            message: "User registered successfully", 
            status: 201,
            userId: result.insertedId.toString()
        };

    } catch (error) {
        console.error("Error registering user:", error);
        return { message: "Error registering user", status: 500 };
    } finally {
        await client.close();
    }
}