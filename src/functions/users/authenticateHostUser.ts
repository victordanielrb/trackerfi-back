import { Request } from 'express';
import bcrypt from 'bcrypt';
import mongo from "../../mongo";
import { HostUser, UserType, UserStatus } from "../../interfaces/user";

interface AuthenticateHostUserRequest {
  email: string;
  password: string;
}

export default async function authenticateHostUser(req: Request<{}, {}, AuthenticateHostUserRequest>) {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
        const usersCollection = database.collection("users");

        // Validate required fields
        if (!req.body.email || !req.body.password) {
            return { 
                message: "Email and password are required", 
                status: 400 
            };
        }

        // Find user by email and user type
        const user = await usersCollection.findOne({ 
            email: req.body.email,
            user_type: UserType.HOST
        }) as HostUser | null;

        if (!user) {
            return { 
                message: "Invalid email or password", 
                status: 401 
            };
        }

        // Check if user account is active
        if (user.status !== UserStatus.ACTIVE) {
            return { 
                message: "Account is not active", 
                status: 403 
            };
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(req.body.password, user.password_hash);
        
        if (!isPasswordValid) {
            return { 
                message: "Invalid email or password", 
                status: 401 
            };
        }

        // Don't return password hash in response
        const { password_hash, temp_password, ...safeUser } = user;
        
        return { 
            message: { 
                user: safeUser,
                // In a real application, you would generate a JWT token here
                message: "Authentication successful"
            }, 
            status: 200 
        };
    } catch (error) {
        console.error("Error authenticating host user:", error);
        return { message: "Error during authentication", status: 500 };
    } finally {
        await client.close();
    }
}
