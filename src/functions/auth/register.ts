
import { log } from "console";
import mongo from "../../mongo";
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // Higher number = more secure but slower

export default async function register(email: string, password: string, username: string): Promise<{ success: boolean; message: string; data?: any }> {
    const client = mongo();
    const passwd = password.trim();
    try {
        await client.connect();
        const database = client.db("trackerfi");
        const loginCollection = database.collection("login_users");

        // Check if user already exists
        const existingUser = await loginCollection.findOne({
            $or: [
                { email: email },
                { username: username }
            ]
        });

        if (existingUser) {
            return { success: false, message: "User with this email or username already exists" };
        }

        // Hash the password before storing
        const password_hash = await bcrypt.hash(passwd, SALT_ROUNDS);
        
       
        const userToStore = {
            email: email,
            username: username,
            password_hash: password_hash,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const result = await loginCollection.insertOne(userToStore);

        if (!result.insertedId) {
            return { success: false, message: "Error registering user" };
        }

        return { 
            success: true,
            message: "User registered successfully", 
            data: {
                userId: result.insertedId.toString(),
                email: email,
                username: username
            }
        };

    } catch (error) {
        console.error("Error registering user:", error);
        return { success: false, message: "Error registering user" };
    } finally {
        await client.close();
    }
}