"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenDetails = getTokenDetails;
const axios_1 = __importDefault(require("axios"));
const mongo_1 = require("../../mongo");
// CoinGecko API configuration
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const coingeckoHeaders = COINGECKO_API_KEY ? { 'x-cg-demo-api-key': COINGECKO_API_KEY } : {};
/**
 * Fetch detailed data for a single token.
 * First checks local database, then falls back to CoinGecko API.
 * @param id CoinGecko token id (e.g. 'bitcoin')
 */
async function getTokenDetails(id) {
    if (!id)
        throw new Error('Token id is required');
    // First, try to get from local database
    const localToken = await getTokenFromDB(id);
    // Check if cached token is valid (has data and is less than 1 hour old)
    if (localToken && localToken.mcap && localToken.price && localToken.updated_at > (new Date(Date.now() - 3600 * 1000)).toISOString()) {
        return localToken;
    }
    // Fallback to CoinGecko API
    try {
        const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
        const { data } = await axios_1.default.get(url, { timeout: 20000, headers: coingeckoHeaders });
        if (!data || !data.id)
            return null;
        const md = data.market_data || {};
        const mapped = {
            id: data.id,
            name: data.name,
            symbol: (data.symbol || '').toUpperCase(),
            address: '',
            chain: 'coingecko',
            position_type: 'spot',
            price: md.current_price?.usd,
            mcap: md.market_cap?.usd,
            usd_24h_volume: md.total_volume?.usd,
            usd_24h_change: md.price_change_percentage_24h,
            price_change_24h: md.price_change_percentage_24h,
            icon_url: data.image?.large || data.image?.thumb,
            updated_at: new Date().toISOString(),
            chain_specific: { native_chain: 'coingecko' }
        };
        // Save to database for caching
        await saveTokenToDB(data);
        return mapped;
    }
    catch (error) {
        // Handle rate limiting (429) or other API errors
        if (axios_1.default.isAxiosError(error)) {
            if (error.response?.status === 429) {
                console.warn(`CoinGecko rate limit hit for token: ${id}`);
                throw new Error('Rate limit exceeded. Please try again later.');
            }
            console.error(`CoinGecko API error for token ${id}:`, error.response?.status, error.message);
        }
        throw error;
    }
}
/**
 * Get token from local database
 */
async function getTokenFromDB(id) {
    try {
        return await (0, mongo_1.withMongoDB)(async (client) => {
            const db = client.db('trackerfi');
            const collection = db.collection('alltokens');
            const token = await collection.findOne({ id });
            if (!token)
                return null;
            // Map to TokensFromWallet interface
            const mapped = {
                id: token.id,
                name: token.name,
                symbol: (token.symbol || '').toUpperCase(),
                address: '',
                chain: 'coingecko',
                position_type: 'spot',
                price: token.current_price,
                mcap: token.market_cap,
                usd_24h_volume: token.total_volume,
                usd_24h_change: token.price_change_percentage_24h,
                price_change_24h: token.price_change_percentage_24h,
                icon_url: token.image,
                updated_at: token.updated_at || new Date().toISOString(),
                chain_specific: { native_chain: 'coingecko' }
            };
            return mapped;
        });
    }
    catch (error) {
        console.error('Error fetching token from DB:', error);
        return null;
    }
}
/**
 * Save token data to local database for caching
 */
async function saveTokenToDB(data) {
    try {
        await (0, mongo_1.withMongoDB)(async (client) => {
            const db = client.db('trackerfi');
            const collection = db.collection('alltokens');
            const md = data.market_data || {};
            const tokenDoc = {
                id: data.id,
                name: data.name,
                symbol: data.symbol,
                image: data.image?.large || data.image?.thumb,
                current_price: md.current_price?.usd,
                market_cap: md.market_cap?.usd,
                total_volume: md.total_volume?.usd,
                price_change_percentage_24h: md.price_change_percentage_24h,
                updated_at: new Date().toISOString()
            };
            await collection.updateOne({ id: data.id }, { $set: tokenDoc }, { upsert: true });
        });
    }
    catch (error) {
        console.error('Error saving token to DB:', error);
        // Don't throw - caching failure shouldn't break the request
    }
}
