import 'dotenv/config';
import axios from 'axios';
import { withMongoDB } from '../mongo';
import { ObjectId } from 'mongodb';

interface Transaction {
    id: string;
    type: string;
    protocol?: string;
    mined_at: string;
    hash: string;
    status: string;
    direction?: string;
    address_from?: string;
    address_to?: string;
    chain?: string;
    fee?: {
        value: number;
        price: number;
        fungible_info: {
            name: string;
            symbol: string;
            icon?: { url: string };
        };
    };
    transfers?: Array<{
        fungible_info?: {
            name: string;
            symbol: string;
            icon?: { url: string };
        };
        direction: string;
        quantity: { float: number; numeric: string };
        value?: number;
        price?: number;
        nft_info?: any;
    }>;
    applications?: Array<{
        name: string;
        icon?: { url: string };
    }>;
}

interface TransactionWithMeta {
    wallet_address: string;
    chain: string;
    transaction: Transaction;
    fetched_at: Date;
}

const ZERION_API_KEY_HASH = process.env.ZERION_API_KEY_HASH;

if (!ZERION_API_KEY_HASH) {
    console.error('❌ ZERION_API_KEY_HASH not found in environment variables');
    process.exit(1);
}

/**
 * Fetch transactions for a single wallet from Zerion API
 */
async function fetchWalletTransactionsFromAPI(
    walletAddress: string,
    chain?: string
): Promise<any[]> {
    const headers = {
        'accept': 'application/json',
        'authorization': `Basic ${ZERION_API_KEY_HASH}`
    };

    let url = `https://api.zerion.io/v1/wallets/${walletAddress}/transactions/?page[size]=100`;
    
    if (chain && chain !== 'all') {
        url += `&filter[chain_ids]=${chain}`;
    }

    const response = await axios.get(url, { headers });
    
    if (!response.data || !Array.isArray(response.data.data)) {
        throw new Error('Invalid response format from Zerion API');
    }

    return response.data.data;
}

/**
 * Fetch and store transactions for all users with tracked wallets
 */
async function fetchAllWalletTransactions() {
    try {
        console.log('🚀 Starting wallet transactions fetch process...');
        console.log(`📅 Time: ${new Date().toISOString()}`);

        await withMongoDB(async client => {
            const db = client.db('trackerfi');
            
            // Get all users who have tracked wallets
            const users = await db.collection('users').find(
                { wallets: { $exists: true, $ne: [] } },
                { projection: { _id: 1, email: 1, wallets: 1 } }
            ).toArray();

            console.log(`Found ${users.length} users with tracked wallets`);

            let successCount = 0;
            let errorCount = 0;

            // Ensure index on user_transactions collection
            await db.collection('user_transactions').createIndex(
                { user_id: 1 }, 
                { background: true, unique: true }
            );

            for (const user of users) {
                try {
                    const userId = user._id.toString();
                    const wallets = user.wallets || [];
                    
                    console.log(`\n👤 User ${userId} (${user.email || 'no email'}) - ${wallets.length} wallets`);
                    
                    const allTransactions: TransactionWithMeta[] = [];

                    // Fetch transactions for each wallet
                    for (const wallet of wallets) {
                        try {
                            if (!wallet.address) {
                                console.warn(`     ⚠️ Skipping wallet with no address`);
                                continue;
                            }

                            // Normalize chain for API call
                            // If chain is 'EVM', 'evm', or 'all', we don't filter by chain (fetch all)
                            let apiChainFilter = wallet.chain;
                            if (apiChainFilter && (apiChainFilter.toLowerCase() === 'evm' || apiChainFilter.toLowerCase() === 'all')) {
                                apiChainFilter = undefined;
                            }

                            console.log(`  📥 Fetching: ${wallet.address} (${apiChainFilter || 'all chains'})`);
                            
                            const transactions = await fetchWalletTransactionsFromAPI(
                                wallet.address,
                                apiChainFilter
                            );

                            console.log(`     ✓ Got ${transactions.length} transactions`);

                            // Transform and add to collection
                            const walletTransactions: TransactionWithMeta[] = transactions.map((tx: any) => {
                                // Flatten Zerion V1 response
                                const attributes = tx.attributes || {};
                                const relationships = tx.relationships || {};
                                
                                // Extract chain from relationships if available, otherwise use wallet chain
                                let txChain = wallet.chain;
                                if (relationships.chain && relationships.chain.data && relationships.chain.data.id) {
                                    txChain = relationships.chain.data.id;
                                }

                                const flattenedTx: Transaction = {
                                    id: tx.id,
                                    type: tx.type,
                                    ...attributes,
                                    chain: txChain
                                };

                                return {
                                    wallet_address: wallet.address,
                                    chain: wallet.chain || 'evm',
                                    transaction: flattenedTx,
                                    fetched_at: new Date()
                                };
                            });

                            allTransactions.push(...walletTransactions);

                            // Small delay between wallet requests
                            await new Promise(res => setTimeout(res, 500));

                        } catch (walletError: any) {
                            console.error(`     ✗ Failed for ${wallet.address}:`, walletError.message);
                        }
                    }

                    // Sort by date (newest first)
                    allTransactions.sort((a, b) => 
                        new Date(b.transaction.mined_at).getTime() - 
                        new Date(a.transaction.mined_at).getTime()
                    );

                    // Store in MongoDB
                    await db.collection('user_transactions').replaceOne(
                        { user_id: new ObjectId(userId) },
                        {
                            user_id: new ObjectId(userId),
                            transactions: allTransactions,
                            last_updated: new Date()
                        },
                        { upsert: true }
                    );

                    console.log(`  💾 Stored ${allTransactions.length} total transactions for user`);
                    successCount++;
                    
                    // Delay between users to avoid rate limits
                    await new Promise(res => setTimeout(res, 1000));
                    
                } catch (error: any) {
                    console.error(`✗ Failed for user ${user._id}:`, error.message);
                    errorCount++;
                }
            }

            console.log('\n========== SUMMARY ==========');
            console.log(`Total users processed: ${users.length}`);
            console.log(`Successful: ${successCount}`);
            console.log(`Failed: ${errorCount}`);
            console.log('==============================');
        });

        console.log('\n✅ Wallet transactions fetch process completed');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Wallet transactions fetch process failed:', error);
        process.exit(1);
    }
}

// Run the script
fetchAllWalletTransactions();
