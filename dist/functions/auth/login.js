"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = login;
const mongo_1 = __importDefault(require("../../mongo"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jwtUtil_1 = require("./jwtUtil");
async function login(email, password) {
    const client = (0, mongo_1.default)();
    try {
        await client.connect();
        const database = client.db("trackerfi");
        const loginCollection = database.collection("login_users");
        // Find user by email
        const user = await loginCollection.findOne({ email });
        if (!user) {
            return {
                success: false,
                message: "Invalid email or password"
            };
        }
        // Verify password
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return {
                success: false,
                message: "Invalid email or password"
            };
        }
        // Generate JWT token
        const token = (0, jwtUtil_1.generateToken)({
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
    }
    catch (error) {
        console.error("Error logging in user:", error);
        return {
            success: false,
            message: "Error logging in user"
        };
    }
    finally {
        await client.close();
    }
}
