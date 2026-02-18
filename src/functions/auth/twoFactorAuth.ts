import { getDb } from "../../mongo";
import { ObjectId } from "mongodb";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

interface TwoFactorResult {
    success: boolean;
    message: string;
    data?: any;
}

/**
 * Generate a new TOTP secret and QR code for a user.
 * The secret is stored; the QR code is returned to the client for scanning.
 */
export async function add2FA(userId: string): Promise<TwoFactorResult> {
    try {
        const db = await getDb();
        const loginCollection = db.collection("login_users");

        const user = await loginCollection.findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return { success: false, message: "User not found" };
        }

        // Generate a new TOTP secret
        const secret = speakeasy.generateSecret({
            name: `TrackerFi:${user.email}`,
            issuer: 'TrackerFi',
            length: 20,
        });

        // Store the base32 secret (NOT revealed after setup)
        const result = await loginCollection.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    two_factor_secret: secret.base32,
                    two_factor_enabled: false, // not enabled until verified
                    two_factor_updated_at: new Date().toISOString()
                }
            }
        );

        if (result.modifiedCount === 0) {
            return { success: false, message: "Failed to setup 2FA" };
        }

        // Generate QR code for the authenticator app
        const otpauthUrl = secret.otpauth_url!;
        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

        return {
            success: true,
            message: "2FA secret generated. Scan the QR code and verify with a code to enable.",
            data: {
                userId,
                qrCode: qrCodeDataUrl,
                manualEntryKey: secret.base32,
            }
        };
    } catch (error) {
        console.error("Error setting up 2FA:", error);
        return { success: false, message: "Error setting up 2FA" };
    }
}

/**
 * Verify a TOTP code and enable 2FA if correct.
 */
export async function verify2FA(userId: string, token: string): Promise<TwoFactorResult> {
    try {
        const db = await getDb();
        const loginCollection = db.collection("login_users");

        const user = await loginCollection.findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return { success: false, message: "User not found" };
        }

        if (!user.two_factor_secret) {
            return { success: false, message: "2FA has not been set up. Call add2FA first." };
        }

        // Verify the TOTP token
        const isValid = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token: token,
            window: 1, // allow 1 step tolerance (30 seconds)
        });

        if (!isValid) {
            return { success: false, message: "Invalid 2FA code" };
        }

        // Enable 2FA if not already enabled
        if (!user.two_factor_enabled) {
            await loginCollection.updateOne(
                { _id: new ObjectId(userId) },
                {
                    $set: {
                        two_factor_enabled: true,
                        two_factor_updated_at: new Date().toISOString()
                    }
                }
            );
        }

        return {
            success: true,
            message: "2FA verified successfully",
            data: { userId, verified: true, two_factor_enabled: true }
        };
    } catch (error) {
        console.error("Error verifying 2FA:", error);
        return { success: false, message: "Error verifying 2FA" };
    }
}

/**
 * Remove 2FA from a user
 */
export async function remove2FA(userId: string): Promise<TwoFactorResult> {
    try {
        const db = await getDb();
        const loginCollection = db.collection("login_users");

        const user = await loginCollection.findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return { success: false, message: "User not found" };
        }

        const result = await loginCollection.updateOne(
            { _id: new ObjectId(userId) },
            {
                $unset: { two_factor_secret: "", two_factor_hash: "" },
                $set: {
                    two_factor_enabled: false,
                    two_factor_updated_at: new Date().toISOString()
                }
            }
        );

        if (result.modifiedCount === 0) {
            return { success: false, message: "Failed to remove 2FA or 2FA was not enabled" };
        }

        return {
            success: true,
            message: "2FA removed successfully",
            data: { userId, two_factor_enabled: false }
        };
    } catch (error) {
        console.error("Error removing 2FA:", error);
        return { success: false, message: "Error removing 2FA" };
    }
}

/**
 * Get user's 2FA status (does NOT return the secret)
 */
export async function get2FA(userId: string): Promise<TwoFactorResult> {
    try {
        const db = await getDb();
        const loginCollection = db.collection("login_users");

        const user = await loginCollection.findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return { success: false, message: "User not found" };
        }

        return {
            success: true,
            message: "2FA status retrieved successfully",
            data: {
                userId,
                two_factor_enabled: user.two_factor_enabled || false,
                two_factor_updated_at: user.two_factor_updated_at || null
                // secret is NEVER returned
            }
        };
    } catch (error) {
        console.error("Error getting 2FA:", error);
        return { success: false, message: "Error getting 2FA status" };
    }
}

export default { add2FA, remove2FA, get2FA, verify2FA };
