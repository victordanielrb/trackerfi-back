import { Request } from 'express';
import bcrypt from 'bcrypt';
import mongo from "../../mongo";
import { HostUser, UserType, UserStatus } from "../../interfaces/user";

interface CreateHostUserRequest {
  username: string;
  email: string; // Required
  password: string; // Raw password - will be hashed
  discord_id?: string;
  google_id?: string;
  temp_password?: string;
  email_verified?: boolean;
}

export default async function createHostUser(req: Request<{}, {}, CreateHostUserRequest>) {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
        const usersCollection = database.collection("users");

        // Validate required fields
        if (!req.body.username || !req.body.email || !req.body.password) {
            return { 
                message: "Username, email, and password are required for host users", 
                status: 400 
            };
        }

        // Validate password strength
        if (req.body.password.length < 8) {
            return { 
                message: "Password must be at least 8 characters long", 
                status: 400 
            };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.email)) {
            return { 
                message: "Please provide a valid email address", 
                status: 400 
            };
        }

        // Check if user already exists with this email or username
        const existingUser = await usersCollection.findOne({ 
            $or: [
                { username: req.body.username },
                { email: req.body.email }
            ]
        });
        if (existingUser) {
            return { message: "User with this username or email already exists", status: 409 };
        }

        // Hash password
        const saltRounds = 12;
        const password_hash = await bcrypt.hash(req.body.password, saltRounds);

        // Create new host user
        const newHostUser: Omit<HostUser, 'id'> = {
            username: req.body.username,
            user_type: UserType.HOST,
            email: req.body.email,
            discord_id: req.body.discord_id,
            google_id: req.body.google_id,
            password_hash: password_hash,
            temp_password: req.body.temp_password,
            email_verified: req.body.email_verified || false,
            status: UserStatus.ACTIVE,
            campaigns_created: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            
        };

        const result = await usersCollection.insertOne(newHostUser);
        
        // Don't return password hash in response
        const { password_hash: _, ...safeUser } = newHostUser;
        
        return { 
            message: { 
                ...safeUser, 
                id: result.insertedId.toString() 
            }, 
            status: 201 
        };
    } catch (error) {
        console.error("Error creating host user:", error);
        return { message: "Error creating host user", status: 500 };
    } finally {
        await client.close();
    }
}
