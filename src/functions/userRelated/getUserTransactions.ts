import { ObjectId } from 'mongodb';
import { withMongoDB } from '../../mongo';
import { Transaction, TransactionFilter, UserTransactionsDocument } from '../../interfaces/transactionInterface';
import getWalletTransactions from '../wallets/getWalletTransactions';
import getUserTrackedWallets from './getUserTrackedWallets';

interface TransactionWithMeta {
    wallet_address: string;
    chain: string;
    transaction: Transaction;
    fetched_at: Date;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Get user transactions from cache or fetch from API
 */
export async function getUserTransactions(
    userId: string,
    filter?: TransactionFilter
): Promise<{
    transactions: TransactionWithMeta[];
    nextCursor?: string;
    totalCount: number;
}> {
    try {
        console.log('=== DEBUG getUserTransactions ===');
        console.log('userId:', userId);
        console.log('filter:', JSON.stringify(filter, null, 2));
        
        // First, get user's tracked wallets (returns array directly)
        const wallets = await getUserTrackedWallets(userId);
        
        console.log('wallets from getUserTrackedWallets:', JSON.stringify(wallets, null, 2));
        
        if (!wallets || wallets.length === 0) {
            console.log('No wallets found, returning empty');
            return { transactions: [], totalCount: 0 };
        }

        // Filter wallets if specific wallet_address is provided
        let walletsToFetch = wallets;
        if (filter?.wallet_address) {
            walletsToFetch = wallets.filter(
                (w: any) => w.address.toLowerCase() === filter.wallet_address!.toLowerCase()
            );
            console.log('Filtered walletsToFetch:', JSON.stringify(walletsToFetch, null, 2));
        }

        // Check if we have fresh cached transactions
        const cached = await getCachedUserTransactions(userId);
        const now = Date.now();
        
        if (cached && (now - cached.last_updated.getTime()) < CACHE_DURATION) {
            console.log(`Using cached transactions for user ${userId}`);
            let transactions = cached.transactions;
            
            // Apply filters
            transactions = applyFilters(transactions, filter);
            
            console.log('Returning cached transactions count:', transactions.length);
            return {
                transactions,
                totalCount: transactions.length
            };
        }

        // Fetch fresh transactions for each wallet
        console.log(`Fetching transactions for user ${userId} (${walletsToFetch.length} wallets)`);
        const allTransactions: TransactionWithMeta[] = [];

        for (const wallet of walletsToFetch) {
            try {
                console.log(`Fetching for wallet: ${wallet.address}, chain: ${wallet.chain}`);
                const result = await getWalletTransactions(
                    wallet.address,
                    wallet.chain !== 'all' ? wallet.chain : undefined,
                    filter?.cursor
                );

                console.log(`Got ${result.transactions?.length || 0} transactions for ${wallet.address}`);

                const walletTransactions: TransactionWithMeta[] = result.transactions.map(tx => ({
                    wallet_address: wallet.address,
                    chain: wallet.chain || 'evm',
                    transaction: {
                        ...tx,
                        chain: wallet.chain
                    } as Transaction,
                    fetched_at: new Date()
                }));

                allTransactions.push(...walletTransactions);
            } catch (error) {
                console.warn(`Failed to fetch transactions for wallet ${wallet.address}:`, error);
            }
        }

        // Sort by date (newest first)
        allTransactions.sort((a, b) => 
            new Date(b.transaction.mined_at).getTime() - new Date(a.transaction.mined_at).getTime()
        );

        // Cache the transactions
        await saveUserTransactions(userId, allTransactions);

        // Apply filters
        const filteredTransactions = applyFilters(allTransactions, filter);

        console.log('=== END DEBUG getUserTransactions ===');
        console.log('Returning fresh transactions count:', filteredTransactions.length);

        return {
            transactions: filteredTransactions,
            totalCount: filteredTransactions.length
        };

    } catch (error) {
        console.error('Error getting user transactions:', error);
        throw error;
    }
}

/**
 * Apply filters to transactions
 */
function applyFilters(
    transactions: TransactionWithMeta[],
    filter?: TransactionFilter
): TransactionWithMeta[] {
    if (!filter) return transactions;

    let filtered = [...transactions];

    if (filter.wallet_address) {
        filtered = filtered.filter(
            t => t.wallet_address.toLowerCase() === filter.wallet_address!.toLowerCase()
        );
    }

    if (filter.chain) {
        filtered = filtered.filter(t => t.chain === filter.chain);
    }

    if (filter.type) {
        filtered = filtered.filter(t => t.transaction.type === filter.type);
    }

    if (filter.direction) {
        filtered = filtered.filter(t => t.transaction.direction === filter.direction);
    }

    if (filter.from_date) {
        filtered = filtered.filter(
            t => new Date(t.transaction.mined_at) >= filter.from_date!
        );
    }

    if (filter.to_date) {
        filtered = filtered.filter(
            t => new Date(t.transaction.mined_at) <= filter.to_date!
        );
    }

    if (filter.limit) {
        filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
}

/**
 * Get cached user transactions from MongoDB
 */
async function getCachedUserTransactions(userId: string): Promise<UserTransactionsDocument | null> {
    try {
        return await withMongoDB(async client => {
            const db = client.db('trackerfi');
            const collection = db.collection('transactions');

            const result = await collection.findOne({
                user_id: new ObjectId(userId)
            });

            return result as unknown as UserTransactionsDocument | null;
        });
    } catch (error) {
        console.error('Error getting cached transactions:', error);
        return null;
    }
}

/**
 * Save user transactions to MongoDB (indexed by user_id)
 */
async function saveUserTransactions(
    userId: string,
    transactions: TransactionWithMeta[]
): Promise<void> {
    try {
        await withMongoDB(async client => {
            const db = client.db('trackerfi');
            const collection = db.collection('transactions');

            // Ensure index on user_id
            await collection.createIndex({ user_id: 1 }, { background: true });

            await collection.replaceOne(
                { user_id: new ObjectId(userId) },
                {
                    user_id: new ObjectId(userId),
                    transactions,
                    last_updated: new Date()
                },
                { upsert: true }
            );

            console.log(`Saved ${transactions.length} transactions for user ${userId}`);
        });
    } catch (error) {
        console.error('Error saving user transactions:', error);
        // Don't throw - caching failure shouldn't break the request
    }
}

/**
 * Force refresh user transactions (bypass cache)
 */
export async function refreshUserTransactions(
    userId: string,
    walletAddress?: string
): Promise<{
    transactions: TransactionWithMeta[];
    totalCount: number;
}> {
    // Delete cached transactions first
    try {
        await withMongoDB(async client => {
            const db = client.db('trackerfi');
            await db.collection('transactions').deleteOne({
                user_id: new ObjectId(userId)
            });
        });
    } catch (error) {
        console.warn('Failed to clear transaction cache:', error);
    }

    // Fetch fresh
    return getUserTransactions(userId, { wallet_address: walletAddress });
}

export default getUserTransactions;
