import mongo from "../../mongo";
import { ObjectId } from "mongodb";

interface TwoFactorResult {
    success: boolean;
    message: string;
    data?: any;
}

/**
 * Add or update 2FA hash for a user
 */
export async function add2FA(userId: string, twoFactorHash: string): Promise<TwoFactorResult> {
    const client = mongo();
    
    try {
        await client.connect();
        const database = client.db("trackerfi");
        const loginCollection = database.collection("login_users");

        // Find user by ID
        const user = await loginCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return { 
                success: false,
                message: "User not found"
            };
        }

        // Update user with 2FA hash
        const result = await loginCollection.updateOne(
            { _id: new ObjectId(userId) },
            { 
                $set: { 
                    two_factor_hash: twoFactorHash,
                    two_factor_enabled: true,
                    two_factor_updated_at: new Date().toISOString()
                } 
            }
        );

        if (result.modifiedCount === 0) {
            return { 
                success: false,
                message: "Failed to add 2FA"
            };
        }

        return {
            success: true,
            message: "2FA added successfully",
            data: {
                userId: userId,
                two_factor_enabled: true
            }
        };

    } catch (error) {
        console.error("Error adding 2FA:", error);
        return { 
            success: false,
            message: "Error adding 2FA"
        };
    } finally {
        await client.close();
    }
}

/**
 * Remove 2FA from a user
 */
export async function remove2FA(userId: string): Promise<TwoFactorResult> {
    const client = mongo();
    
    try {
        await client.connect();
        const database = client.db("trackerfi");
        const loginCollection = database.collection("login_users");

        // Find user by ID
        const user = await loginCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return { 
                success: false,
                message: "User not found"
            };
        }

        // Remove 2FA fields
        const result = await loginCollection.updateOne(
            { _id: new ObjectId(userId) },
            { 
                $unset: { 
                    two_factor_hash: "",
                },
                $set: {
                    two_factor_enabled: false,
                    two_factor_updated_at: new Date().toISOString()
                }
            }
        );

        if (result.modifiedCount === 0) {
            return { 
                success: false,
                message: "Failed to remove 2FA or 2FA was not enabled"
            };
        }

        return {
            success: true,
            message: "2FA removed successfully",
            data: {
                userId: userId,
                two_factor_enabled: false
            }
        };

    } catch (error) {
        console.error("Error removing 2FA:", error);
        return { 
            success: false,
            message: "Error removing 2FA"
        };
    } finally {
        await client.close();
    }
}

/**
 * Get user's 2FA status and hash
 */
export async function get2FA(userId: string): Promise<TwoFactorResult> {
    const client = mongo();
    
    try {
        await client.connect();
        const database = client.db("trackerfi");
        const loginCollection = database.collection("login_users");

        // Find user by ID
        const user = await loginCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return { 
                success: false,
                message: "User not found"
            };
        }

        return {
            success: true,
            message: "2FA status retrieved successfully",
            data: {
                userId: userId,
                two_factor_enabled: user.two_factor_enabled || false,
                two_factor_hash: user.two_factor_hash || null,
                two_factor_updated_at: user.two_factor_updated_at || null
            }
        };

    } catch (error) {
        console.error("Error getting 2FA:", error);
        return { 
            success: false,
            message: "Error getting 2FA status"
        };
    } finally {
        await client.close();
    }
}

/**
 * Verify 2FA hash matches stored hash
 */
export async function verify2FA(userId: string, providedHash: string): Promise<TwoFactorResult> {
    const client = mongo();
    
    try {
        await client.connect();
        const database = client.db("trackerfi");
        const loginCollection = database.collection("login_users");

        // Find user by ID
        const user = await loginCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return { 
                success: false,
                message: "User not found"
            };
        }

        if (!user.two_factor_enabled || !user.two_factor_hash) {
            return { 
                success: false,
                message: "2FA is not enabled for this user"
            };
        }

        // Compare the provided hash with stored hash
        const isValid = providedHash === user.two_factor_hash;

        return {
            success: isValid,
            message: isValid ? "2FA verified successfully" : "Invalid 2FA code",
            data: {
                userId: userId,
                verified: isValid
            }
        };

    } catch (error) {
        console.error("Error verifying 2FA:", error);
        return { 
            success: false,
            message: "Error verifying 2FA"
        };
    } finally {
        await client.close();
    }
}

export default { add2FA, remove2FA, get2FA, verify2FA };
