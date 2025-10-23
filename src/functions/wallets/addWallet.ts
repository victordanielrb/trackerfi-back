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

// PLACEHOLDER: Check if wallet is already in use
const isWalletInUse = async (address: string, blockchain: Blockchain, database: any): Promise<string | null> => {
    const existingWallet = await database.collection("user_wallets").findOne({
        wallet_address: address,
        blockchain: blockchain
    });
    
    return existingWallet ? existingWallet.user_id : null;
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
        const user = await database.collection("login_users").findOne({ _id: new ObjectId(user_id) });
        if (!user) {
            return { status: 404, message: { error: "User not found" } };
        }

        // PLACEHOLDER: Validar formato do endereço da wallet
        const addressValidation = await validateWalletAddress(wallet_address, blockchain as Blockchain);
        if (!addressValidation.valid) {
            return { status: 400, message: { error: addressValidation.reason || "Invalid wallet address" } };
        }

        // Verificar se já tem wallet para esta blockchain
        const existingWallet = await database.collection("user_wallets").findOne({
            user_id,
            blockchain
        });
        
        if (existingWallet) {
            // Atualizar endereço se for diferente
            if (existingWallet) {
            
                const updateResult = await database.collection("user_wallets").updateOne(
                    { user_id, blockchain },
                    { 
                        $set: { 
                            wallet_address,
                            connected_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }
                    }
                );
                console.log(`🔄 Updated wallet for user ${user_id} on ${blockchain}`);
                return { status: 200, message: { message: "Wallet address updated successfully", updated: true } };
            } else {
                return { status: 409, message: { error: "User already has this wallet registered for this blockchain" } };
            }
        }

        // PLACEHOLDER: Verificar propriedade da wallet
        const ownershipVerified = await verifyWalletOwnership(wallet_address, blockchain as Blockchain, user_id);
        if (!ownershipVerified) {
            return { status: 403, message: { error: "Wallet ownership verification failed" } };
        }
        
        const newWallet: Partial<UserWallet> = {
            user_id,
            blockchain: blockchain as Blockchain,
            wallet_address,
            connected_at: new Date().toISOString()
        };
        
        const result = await database.collection("user_wallets").insertOne(newWallet);

        console.log(`✅ Wallet added successfully for user ${user_id} on ${blockchain}`);
        
        return { 
            status: 201,
            message: {
                message: "Wallet added successfully",
                id: result.insertedId.toString(), 
                user_id,
                blockchain,
                wallet_address,
                connected_at: newWallet.connected_at,
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
