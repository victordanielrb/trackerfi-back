"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getWalletTransactions;
const axios_1 = __importDefault(require("axios"));
const mongo_1 = require("../../mongo");
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const ZERION_API_KEY = process.env.ZERION_API_KEY;
if (!ZERION_API_KEY) {
    console.warn('ZERION_API_KEY not found in environment variables');
}
async function getWalletTransactions(walletAddress, chain, cursor) {
    try {
        const cacheKey = `${walletAddress}_${chain || 'all'}`;
        // Check if we have fresh cached data (only if no cursor is provided - for pagination)
        if (!cursor) {
            const cached = await getTransactionsFromCache(walletAddress, chain || 'all');
            if (cached && (Date.now() - cached.last_updated.getTime()) < CACHE_DURATION) {
                console.log(`Using cached wallet transactions for ${walletAddress} (${chain || 'all chains'})`);
                return {
                    transactions: cached.transactions,
                    nextCursor: cached.next_cursor
                };
            }
        }
        // Fetch from Zerion API
        console.log(`Fetching wallet transactions from Zerion for ${walletAddress} (${chain || 'all chains'})`);
        const headers = {
            'Authorization': `Basic ${Buffer.from(ZERION_API_KEY + ':').toString('base64')}`,
            'Content-Type': 'application/json'
        };
        let url = `https://api.zerion.io/v1/wallets/${walletAddress}/transactions/`;
        const params = [];
        if (chain) {
            params.push(`filter[chain_ids]=${chain}`);
        }
        if (cursor) {
            params.push(`page[after]=${cursor}`);
        }
        params.push('page[size]=50'); // Limit to 50 transactions per request
        if (params.length > 0) {
            url += '?' + params.join('&');
        }
        const response = await axios_1.default.get(url, { headers });
        if (!response.data || !Array.isArray(response.data.data)) {
            throw new Error('Invalid response format from Zerion API');
        }
        const transactions = response.data.data;
        const nextCursor = response.data.links?.next ?
            new URL(response.data.links.next).searchParams.get('page[after]') : undefined;
        // Cache only the first page (when no cursor was provided)
        if (!cursor) {
            try {
                await saveTransactionsToCache(walletAddress, chain || 'all', transactions, nextCursor);
                console.log(`Cached wallet transactions for ${walletAddress} (${chain || 'all chains'})`);
            }
            catch (cacheError) {
                console.warn('Failed to cache wallet transactions:', cacheError);
            }
        }
        return { transactions, nextCursor };
    }
    catch (error) {
        console.error('Error fetching wallet transactions:', error);
        // Try to return cached data if API fails
        if (!cursor) {
            try {
                const cached = await getTransactionsFromCache(walletAddress, chain || 'all');
                if (cached) {
                    console.log(`API failed, returning stale cached transactions for ${walletAddress}`);
                    return {
                        transactions: cached.transactions,
                        nextCursor: cached.next_cursor
                    };
                }
            }
            catch (cacheError) {
                console.warn('Failed to retrieve cached transactions:', cacheError);
            }
        }
        throw new Error(`Failed to fetch wallet transactions: ${error.message}`);
    }
}
/**
 * Get transactions from cache
 */
async function getTransactionsFromCache(walletAddress, chain) {
    try {
        return await (0, mongo_1.withMongoDB)(async (client) => {
            const db = client.db('trackerfi');
            const collection = db.collection('wallet_transactions_cache');
            const result = await collection.findOne({
                wallet_address: walletAddress,
                chain: chain
            });
            return result;
        });
    }
    catch (error) {
        console.error('Error fetching transactions from cache:', error);
        return null;
    }
}
/**
 * Save transactions to cache
 */
async function saveTransactionsToCache(walletAddress, chain, transactions, nextCursor) {
    try {
        await (0, mongo_1.withMongoDB)(async (client) => {
            const db = client.db('trackerfi');
            const collection = db.collection('wallet_transactions_cache');
            await collection.replaceOne({
                wallet_address: walletAddress,
                chain: chain
            }, {
                wallet_address: walletAddress,
                chain: chain,
                transactions,
                next_cursor: nextCursor,
                last_updated: new Date()
            }, { upsert: true });
        });
    }
    catch (error) {
        console.error('Error saving transactions to cache:', error);
        // Don't throw - caching failure shouldn't break the request
    }
}
