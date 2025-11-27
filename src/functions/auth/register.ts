
import mongo from "../../mongo";
import bcrypt from 'bcrypt';
import User from "../../interfaces/userInterface";
import { ObjectId } from "mongodb";

const SALT_ROUNDS = 12; // Higher number = more secure but slower

export default async function register(email: string, password: string, username: string): Promise<{ success: boolean; message: string; data?: any }> {
    const client = mongo();
    const passwd = password.trim();
    try {
        await client.connect();
        const database = client.db("trackerfi");
        const loginCollection = database.collection("login_users");
        const usersCollection = database.collection("users");

        // Check if user already exists in login_users (auth collection)
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
        
        // Create auth record in login_users (only for authentication)
        const authUserToStore = {
            email: email,
            username: username,
            password_hash: password_hash,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const authResult = await loginCollection.insertOne(authUserToStore);

        if (!authResult.insertedId) {
            return { success: false, message: "Error registering user" };
        }

        // Create user data record in users collection (using User interface)
        const userData = {
            _id: authResult.insertedId, // Use ObjectId directly
            name: username, // Use username as name for now
            email: email,
            wallets: [], // Initialize empty wallets array
            exchanges: [] // Initialize empty exchanges array
        };

        const userResult = await usersCollection.insertOne(userData);

        if (!userResult.insertedId) {
            // If user data creation fails, cleanup the auth record
            await loginCollection.deleteOne({ _id: authResult.insertedId });
            return { success: false, message: "Error creating user data" };
        }

        console.log(`✅ User registered successfully: ${username} (${email})`);
        console.log(`📧 Auth ID: ${authResult.insertedId.toString()}`);
        console.log(`👤 User ID: ${userResult.insertedId.toString()}`);

        return { 
            success: true,
            message: "User registered successfully", 
            data: {
                userId: authResult.insertedId.toString(),
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