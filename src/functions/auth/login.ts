import mongo from "../../mongo";
import bcrypt from 'bcrypt';
import { generateToken } from './jwtUtil';
import { HostUser, UserType, UserStatus } from "../../interfaces/user";

interface LoginResult {
    message: string;
    status: number;
    data?: {
        token: string;
        user: Omit<HostUser, 'password_hash'>;
    };
}

export default async function login(email: string, password: string): Promise<LoginResult> {
    const client = mongo();
    
    try {
        await client.connect();
        const database = client.db("bounties");
        const usersCollection = database.collection("users");

        // Find user by email
        const user = await usersCollection.findOne({ 
            email, 
            user_type: UserType.HOST,
            status: UserStatus.ACTIVE 
        }) as HostUser | null;

        if (!user) {
            return { 
                message: "Invalid email or password", 
                status: 401 
            };
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isPasswordValid) {
            return { 
                message: "Invalid email or password", 
                status: 401 
            };
        }

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            userType: user.user_type,
            username: user.username,
            email: user.email
        });

        // Return user data without password hash
        const { password_hash, ...userWithoutPassword } = user;

        return {
            message: "User logged in successfully",
            status: 200,
            data: {
                token,
                user: userWithoutPassword
            }
        };

    } catch (error) {
        console.error("Error logging in user:", error);
        return { 
            message: "Error logging in user", 
            status: 500 
        };
    } finally {
        await client.close();
    }
}