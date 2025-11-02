import { Request } from 'express';
import mongo from '../../mongo';
import { ObjectId } from 'mongodb';
import { Blockchain, UserWallet } from '../../interfaces/general';

// PLACEHOLDER: Wallet validation per blockchain
const validateWalletAddress = async (address: string, blockchain: Blockchain): Promise<{ valid: boolean; reason?: string }> => {
    // TODO: Implement actual wallet address validation for each blockchain
    console.log(`🔍 Validating ${blockchain} wallet: ${address}`);
    
    switch (blockchain) {
        case Blockchain.EVM:
            // Ethereum-compatible address validation
            if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
                return { valid: false, reason: "Invalid EVM address format" };
            }
            break;
        case Blockchain.SOLANA:
            // Solana address validation (base58, 32-44 chars)
            if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
                return { valid: false, reason: "Invalid Solana address format" };
            }
            break;
        case Blockchain.SUI:
            // SUI address validation (hex, 64 chars after 0x)
            if (!/^0x[a-fA-F0-9]{64}$/.test(address)) {
                return { valid: false, reason: "Invalid SUI address format" };
            }
            break;
        default:
            return { valid: false, reason: "Unsupported blockchain" };
    }
    
    return { valid: true };
};

// PLACEHOLDER: Check wallet ownership
const verifyWalletOwnership = async (address: string, blockchain: Blockchain, userId: string): Promise<boolean> => {
    // TODO: Implement wallet ownership verification
    // This could involve a signature challenge or other verification method
    console.log(`✅ Verifying wallet ownership for user ${userId} on ${blockchain}`);
    
    // Mock verification - in production, this would require a signature proof
    return true;
};

// Check if a wallet address is already tracked by any user
const isWalletInUse = async (address: string, database: any): Promise<string | null> => {
    // Search users collection for any user that has this address in their wallets array
    const existing = await database.collection("users").findOne({
        "wallets.address": address
    });

    return existing ? (existing._id ? existing._id.toString() : null) : null;
};

const addWallet = async (user_id: string, blockchain: string, wallet_address: string): Promise<{ status: number; message: any }> => {
    const client = mongo();
    try {
        // Validar inputs
        if (!user_id || !blockchain || !wallet_address) {
            return { status: 400, message: { error: "Missing required fields: user_id, blockchain, wallet_address" } };
        }

        if (!Object.values(Blockchain).includes(blockchain as Blockchain)) {
            return { status: 400, message: { error: "Invalid blockchain. Supported: SUI, EVM, SOLANA" } };
        }
        
        await client.connect();
        const database = client.db("trackerfi");
        
        // Verificar se o usuário existe na coleção login_users
        const authUser = await database.collection("login_users").findOne({ _id: new ObjectId(user_id) });
        if (!authUser) {
            return { status: 404, message: { error: "User not found in auth" } };
        }

        // Verificar se o usuário existe na coleção users (onde guardamos os wallets)
        let user = await database.collection("users").findOne({ _id: new ObjectId(user_id) });
        if (!user) {
            // Create users document if it doesn't exist (migration case)
            console.log(`Creating users document for existing user ${user_id}`);
            const newUserData = {
                _id: new ObjectId(user_id),
                name: authUser.username,
                email: authUser.email,
                wallets: [],
                exchanges: []
            };
            
            await database.collection("users").insertOne(newUserData);
            user = newUserData;
        }

        // PLACEHOLDER: Validar formato do endereço da wallet
        const addressValidation = await validateWalletAddress(wallet_address, blockchain as Blockchain);
        if (!addressValidation.valid) {
            return { status: 400, message: { error: addressValidation.reason || "Invalid wallet address" } };
        }

        // Check whether this wallet address is already tracked by another user
        const owner = await isWalletInUse(wallet_address, database);
        if (owner && owner !== user_id) {
            return { status: 409, message: { error: "This wallet address is already tracked by another user" } };
        }

        // Verify wallet ownership (placeholder)
        const ownershipVerified = await verifyWalletOwnership(wallet_address, blockchain as Blockchain, user_id);
        if (!ownershipVerified) {
            return { status: 403, message: { error: "Wallet ownership verification failed" } };
        }

        const now = new Date().toISOString();

        // If the user already has a wallet entry for this chain, update it. Otherwise push a new wallet object
        const userHasChain = await database.collection("users").findOne({
            _id: new ObjectId(user_id),
            "wallets.chain": blockchain
        });

        if (userHasChain) {
            // Update the existing wallet entry for the chain
            const updateResult = await database.collection("users").updateOne(
                { _id: new ObjectId(user_id), "wallets.chain": blockchain },
                { 
                    $set: { 
                        "wallets.$.address": wallet_address,
                        "wallets.$.connected_at": now,
                        "wallets.$.updated_at": now
                    }
                }
            );

            console.log(`🔄 Updated wallet for user ${user_id} on ${blockchain}`);
            return { status: 200, message: { message: "Wallet address updated successfully", updated: true } };
        }

        // Push new wallet entry into the user's wallets array
        const walletObj: any = {
            address: wallet_address,
            chain: blockchain as Blockchain,
            connected_at: now,
            updated_at: now
        };

        const pushResult = await database.collection("users").updateOne(
            { _id: new ObjectId(user_id) },
            { $push: { wallets: walletObj } } as any
        );

        if (pushResult.matchedCount === 0) {
            return { status: 404, message: { error: "User not found" } };
        }

        console.log(`✅ Wallet added successfully for user ${user_id} on ${blockchain}`);

        return {
            status: 201,
            message: {
                message: "Wallet added successfully",
                user_id,
                blockchain,
                wallet_address,
                connected_at: now,
                wallet_info: {
                    blockchain: blockchain,
                    address_format: "validated",
                    ownership_verified: true
                }
            }
        };
    } catch (error) {
        console.error("Error adding wallet:", error);
        return { status: 500, message: { error: "Error adding wallet" } };
    } finally {
        await client.close();
    }
};

export default addWallet;
