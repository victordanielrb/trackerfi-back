import { Request } from 'express';
import mongo from '../../mongo';
import { UserWallet, Blockchain } from '../../interfaces/user';
import { ObjectId } from 'mongodb';

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

const addWallet = async (req: Request) => {
    const client = mongo();
    try {
        const { user_id, blockchain, wallet_address } = req.body;
        
        // Validar inputs
        if (!user_id || !blockchain || !wallet_address) {
            return { message: "Missing required fields: user_id, blockchain, wallet_address", status: 400 };
        }

        if (!Object.values(Blockchain).includes(blockchain)) {
            return { message: "Invalid blockchain. Supported: SUI, EVM, SOLANA", status: 400 };
        }
        
        await client.connect();
        const database = client.db("bounties");
        
        // Verificar se o usuário existe
        const user = await database.collection("users").findOne({ _id: new ObjectId(user_id) });
        if (!user) {
            return { message: "User not found", status: 404 };
        }

        // PLACEHOLDER: Validar formato do endereço da wallet
        const addressValidation = await validateWalletAddress(wallet_address, blockchain as Blockchain);
        if (!addressValidation.valid) {
            return { message: addressValidation.reason, status: 400 };
        }

        // PLACEHOLDER: Verificar se a wallet já está sendo usada por outro usuário
        const walletInUse = await isWalletInUse(wallet_address, blockchain as Blockchain, database);
        if (walletInUse && walletInUse !== user_id) {
            return { message: "Wallet address already registered to another user", status: 400 };
        }

        // Verificar se o usuário já tem 3 wallets
        const existingWallets = await database.collection("user_wallets").countDocuments({ user_id });
        
        if (existingWallets >= 3) {
            return { message: "User already has maximum of 3 wallets", status: 400 };
        }
        
        // Verificar se já tem wallet para esta blockchain
        const existingWallet = await database.collection("user_wallets").findOne({
            user_id,
            blockchain
        });
        
        if (existingWallet) {
            // Atualizar endereço se for diferente
            if (existingWallet.wallet_address !== wallet_address) {
                // PLACEHOLDER: Verificar propriedade da nova wallet
                const ownershipVerified = await verifyWalletOwnership(wallet_address, blockchain as Blockchain, user_id);
                if (!ownershipVerified) {
                    return { message: "Wallet ownership verification failed", status: 403 };
                }

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
                
                return { message: "Wallet address updated successfully", status: 200 };
            } else {
                return { message: "User already has this wallet registered for this blockchain", status: 400 };
            }
        }

        // PLACEHOLDER: Verificar propriedade da wallet
        const ownershipVerified = await verifyWalletOwnership(wallet_address, blockchain as Blockchain, user_id);
        if (!ownershipVerified) {
            return { message: "Wallet ownership verification failed", status: 403 };
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
            message: { 
                _id: result.insertedId, 
                ...newWallet,
                wallet_info: {
                    blockchain: blockchain,
                    address_format: "validated",
                    ownership_verified: true
                }
            }, 
            status: 201 
        };
    } catch (error) {
        console.error("Error adding wallet:", error);
        return { message: "Error adding wallet", status: 500 };
    } finally {
        await client.close();
    }
};

export default addWallet;
