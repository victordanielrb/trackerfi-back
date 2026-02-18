import { getDb } from "../../mongo";
import bcrypt from 'bcrypt';
import { generateToken } from './jwtUtil';
interface LoginResult {
    success: boolean;
    message: string;
    data?: {
        token: string;
        user: any;
    };
}

export default async function login(email: string, password: string): Promise<LoginResult> {
    try {
        const database = await getDb();
        const loginCollection = database.collection("login_users");

        // Find user by email
        const user = await loginCollection.findOne({ email }) as any;

        if (!user) {
            return {
                success: false,
                message: "Invalid email or password"
            };
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return {
                success: false,
                message: "Invalid email or password"
            };
        }

        // Generate JWT token
        const token = generateToken({
            userId: user._id.toString(),
            email: user.email,
            username: user.username
        });

        // Return user data without password hash
        const { password_hash, ...userWithoutPassword } = user;

        return {
            success: true,
            message: "User logged in successfully",
            data: {
                token,
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    username: user.username,
                    created_at: user.created_at
                }
            }
        };

    } catch (error) {
        console.error("Error logging in user:", error);
        return {
            success: false,
            message: "Error logging in user"
        };
    }
}