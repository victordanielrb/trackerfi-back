import { ObjectId } from 'mongodb';
import { getDb } from '../../mongo';
import { Transaction, TransactionFilter } from '../../interfaces/transactionInterface';

interface TransactionWithMeta {
    wallet_address: string;
    chain: string;
    transaction: Transaction;
    fetched_at: Date;
}

interface UserTransactionsDocument {
    user_id: ObjectId;
    transactions: TransactionWithMeta[];
    last_updated: Date;
}

/**
 * Get user transactions from MongoDB (populated by GitHub Action hourly)
 * This is a simple read-only function - no API calls
 */
export async function getUserTransactions(
    userId: string,
    filter?: TransactionFilter
): Promise<{
    transactions: TransactionWithMeta[];
    totalCount: number;
    lastUpdated?: Date;
}> {
    try {
        console.log('=== getUserTransactions (DB read) ===');
        console.log('userId:', userId);
        console.log('filter:', JSON.stringify(filter, null, 2));

        const db = await getDb();
        const collection = db.collection('user_transactions');

        const result = await collection.findOne({
            user_id: new ObjectId(userId)
        }) as unknown as UserTransactionsDocument | null;

        if (!result || !result.transactions) {
            console.log('No transactions found in DB for user');
            return { transactions: [], totalCount: 0 };
        }

        console.log(`Found ${result.transactions.length} transactions in DB, last updated: ${result.last_updated}`);

        // Apply filters
        let transactions = applyFilters(result.transactions, filter);

        console.log(`After filters: ${transactions.length} transactions`);

        return {
            transactions,
            totalCount: transactions.length,
            lastUpdated: result.last_updated
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

export default getUserTransactions;
