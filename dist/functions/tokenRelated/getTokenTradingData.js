"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenTradingData = getTokenTradingData;
const axios_1 = __importDefault(require("axios"));
const mongo_1 = require("../../mongo");
// CoinGecko API configuration
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const coingeckoHeaders = COINGECKO_API_KEY ? { 'x-cg-demo-api-key': COINGECKO_API_KEY } : {};
// Cache duration: 5 minutes for trading data (more frequent updates needed)
const CACHE_DURATION_MS = 5 * 60 * 1000;
// Available timeframes for OHLC data
const OHLC_TIMEFRAMES = [1, 7, 14, 30, 90, 180, 365];
/**
 * Fetch trading/market data for a token id.
 * First checks local cache, then falls back to CoinGecko API.
 * @param id CoinGecko token id (e.g. 'bitcoin')
 */
async function getTokenTradingData(id) {
    if (!id)
        throw new Error('Token id is required');
    // First, try to get from cache
    const cachedData = await getTradingDataFromCache(id);
    if (cachedData) {
        return cachedData;
    }
    // Fallback to CoinGecko API
    try {
        const data = await fetchTradingDataFromAPI(id);
        if (data) {
            // Save to cache
            await saveTradingDataToCache(data);
        }
        return data;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            if (error.response?.status === 429) {
                console.warn(`CoinGecko rate limit hit for trading data: ${id}`);
                // Try to return stale cache if available
                const staleCache = await getTradingDataFromCache(id, true);
                if (staleCache) {
                    console.log(`Returning stale cache for ${id}`);
                    return staleCache;
                }
                throw new Error('Rate limit exceeded. Please try again later.');
            }
            console.error(`CoinGecko API error for trading ${id}:`, error.response?.status, error.message);
        }
        throw error;
    }
}
/**
 * Fetch trading data from CoinGecko API with all timeframes
 */
async function fetchTradingDataFromAPI(id) {
    const encodedId = encodeURIComponent(id);
    // Base detail endpoint (includes current price & change %)
    const detailUrl = `https://api.coingecko.com/api/v3/coins/${encodedId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    // Market chart URLs for different timeframes
    const chartUrls = {
        '1d': `https://api.coingecko.com/api/v3/coins/${encodedId}/market_chart?vs_currency=usd&days=1`,
        '7d': `https://api.coingecko.com/api/v3/coins/${encodedId}/market_chart?vs_currency=usd&days=7`,
        '30d': `https://api.coingecko.com/api/v3/coins/${encodedId}/market_chart?vs_currency=usd&days=30`,
        '90d': `https://api.coingecko.com/api/v3/coins/${encodedId}/market_chart?vs_currency=usd&days=90`,
        '365d': `https://api.coingecko.com/api/v3/coins/${encodedId}/market_chart?vs_currency=usd&days=365`,
    };
    // OHLC URLs for different timeframes
    const ohlcUrls = {
        '1d': `https://api.coingecko.com/api/v3/coins/${encodedId}/ohlc?vs_currency=usd&days=1`,
        '7d': `https://api.coingecko.com/api/v3/coins/${encodedId}/ohlc?vs_currency=usd&days=7`,
        '14d': `https://api.coingecko.com/api/v3/coins/${encodedId}/ohlc?vs_currency=usd&days=14`,
        '30d': `https://api.coingecko.com/api/v3/coins/${encodedId}/ohlc?vs_currency=usd&days=30`,
        '90d': `https://api.coingecko.com/api/v3/coins/${encodedId}/ohlc?vs_currency=usd&days=90`,
        '180d': `https://api.coingecko.com/api/v3/coins/${encodedId}/ohlc?vs_currency=usd&days=180`,
        '365d': `https://api.coingecko.com/api/v3/coins/${encodedId}/ohlc?vs_currency=usd&days=365`,
    };
    console.log(`Fetching all timeframes trading data for: ${id}`);
    // Fetch all data in parallel
    const axiosConfig = { timeout: 15000, headers: coingeckoHeaders };
    const safeGet = (url) => axios_1.default.get(url, axiosConfig).catch(() => ({ data: null }));
    const [detailRes, 
    // Market charts
    chart1dRes, chart7dRes, chart30dRes, chart90dRes, chart365dRes, 
    // OHLC data
    ohlc1dRes, ohlc7dRes, ohlc14dRes, ohlc30dRes, ohlc90dRes, ohlc180dRes, ohlc365dRes] = await Promise.all([
        axios_1.default.get(detailUrl, axiosConfig),
        // Market charts
        safeGet(chartUrls['1d']),
        safeGet(chartUrls['7d']),
        safeGet(chartUrls['30d']),
        safeGet(chartUrls['90d']),
        safeGet(chartUrls['365d']),
        // OHLC
        safeGet(ohlcUrls['1d']),
        safeGet(ohlcUrls['7d']),
        safeGet(ohlcUrls['14d']),
        safeGet(ohlcUrls['30d']),
        safeGet(ohlcUrls['90d']),
        safeGet(ohlcUrls['180d']),
        safeGet(ohlcUrls['365d']),
    ]);
    const detail = detailRes.data;
    if (!detail || !detail.id)
        return null;
    const md = detail.market_data || {};
    // Helper to safely extract array data
    const safeArray = (data) => (Array.isArray(data) ? data : undefined);
    const data = {
        id: detail.id,
        symbol: (detail.symbol || '').toUpperCase(),
        name: detail.name,
        current_price_usd: md.current_price?.usd ?? null,
        price_change_percentage_1h: md.price_change_percentage_1h_in_currency?.usd ?? null,
        price_change_percentage_24h: md.price_change_percentage_24h_in_currency?.usd ?? md.price_change_percentage_24h ?? null,
        price_change_percentage_7d: md.price_change_percentage_7d_in_currency?.usd ?? null,
        price_change_percentage_14d: md.price_change_percentage_14d_in_currency?.usd ?? md.price_change_percentage_14d ?? null,
        price_change_percentage_30d: md.price_change_percentage_30d_in_currency?.usd ?? md.price_change_percentage_30d ?? null,
        price_change_percentage_1y: md.price_change_percentage_1y_in_currency?.usd ?? md.price_change_percentage_1y ?? null,
        market_cap_usd: md.market_cap?.usd ?? null,
        total_volume_24h_usd: md.total_volume?.usd ?? null,
        high_24h_usd: md.high_24h?.usd ?? null,
        low_24h_usd: md.low_24h?.usd ?? null,
        ath_usd: md.ath?.usd ?? null,
        ath_date: md.ath_date?.usd ?? null,
        atl_usd: md.atl?.usd ?? null,
        atl_date: md.atl_date?.usd ?? null,
        last_updated: new Date().toISOString(),
        // Market chart data - prices
        prices_1d: safeArray(chart1dRes.data?.prices),
        prices_7d: safeArray(chart7dRes.data?.prices),
        prices_30d: safeArray(chart30dRes.data?.prices),
        prices_90d: safeArray(chart90dRes.data?.prices),
        prices_365d: safeArray(chart365dRes.data?.prices),
        // Market chart data - market caps
        market_caps_1d: safeArray(chart1dRes.data?.market_caps),
        market_caps_7d: safeArray(chart7dRes.data?.market_caps),
        market_caps_30d: safeArray(chart30dRes.data?.market_caps),
        market_caps_90d: safeArray(chart90dRes.data?.market_caps),
        market_caps_365d: safeArray(chart365dRes.data?.market_caps),
        // Market chart data - volumes
        volumes_1d: safeArray(chart1dRes.data?.total_volumes),
        volumes_7d: safeArray(chart7dRes.data?.total_volumes),
        volumes_30d: safeArray(chart30dRes.data?.total_volumes),
        volumes_90d: safeArray(chart90dRes.data?.total_volumes),
        volumes_365d: safeArray(chart365dRes.data?.total_volumes),
        // OHLC data for all timeframes
        ohlc_1d: safeArray(ohlc1dRes.data),
        ohlc_7d: safeArray(ohlc7dRes.data),
        ohlc_14d: safeArray(ohlc14dRes.data),
        ohlc_30d: safeArray(ohlc30dRes.data),
        ohlc_90d: safeArray(ohlc90dRes.data),
        ohlc_180d: safeArray(ohlc180dRes.data),
        ohlc_365d: safeArray(ohlc365dRes.data),
        // Legacy fields for backward compatibility
        prices_24h: safeArray(chart1dRes.data?.prices),
        market_caps_24h: safeArray(chart1dRes.data?.market_caps),
        volumes_24h: safeArray(chart1dRes.data?.total_volumes),
        ohlc_24h: safeArray(ohlc1dRes.data),
    };
    console.log(`Successfully fetched all timeframes for: ${id}`);
    return data;
}
/**
 * Get trading data from cache
 */
async function getTradingDataFromCache(id, ignoreExpiry = false) {
    try {
        return await (0, mongo_1.withMongoDB)(async (client) => {
            const db = client.db('trackerfi');
            const collection = db.collection('trading_cache');
            const cached = await collection.findOne({ id });
            if (!cached)
                return null;
            // Check if cache is still valid (unless ignoring expiry for stale fallback)
            if (!ignoreExpiry) {
                const cacheAge = Date.now() - new Date(cached.last_updated).getTime();
                if (cacheAge > CACHE_DURATION_MS) {
                    return null; // Cache expired
                }
            }
            return {
                id: cached.id,
                symbol: cached.symbol,
                name: cached.name,
                current_price_usd: cached.current_price_usd,
                price_change_percentage_1h: cached.price_change_percentage_1h,
                price_change_percentage_24h: cached.price_change_percentage_24h,
                price_change_percentage_7d: cached.price_change_percentage_7d,
                price_change_percentage_14d: cached.price_change_percentage_14d,
                price_change_percentage_30d: cached.price_change_percentage_30d,
                price_change_percentage_1y: cached.price_change_percentage_1y,
                market_cap_usd: cached.market_cap_usd,
                total_volume_24h_usd: cached.total_volume_24h_usd,
                high_24h_usd: cached.high_24h_usd,
                low_24h_usd: cached.low_24h_usd,
                ath_usd: cached.ath_usd,
                ath_date: cached.ath_date,
                atl_usd: cached.atl_usd,
                atl_date: cached.atl_date,
                last_updated: cached.last_updated,
                // All timeframe prices
                prices_1d: cached.prices_1d,
                prices_7d: cached.prices_7d,
                prices_30d: cached.prices_30d,
                prices_90d: cached.prices_90d,
                prices_365d: cached.prices_365d,
                // All timeframe market caps
                market_caps_1d: cached.market_caps_1d,
                market_caps_7d: cached.market_caps_7d,
                market_caps_30d: cached.market_caps_30d,
                market_caps_90d: cached.market_caps_90d,
                market_caps_365d: cached.market_caps_365d,
                // All timeframe volumes
                volumes_1d: cached.volumes_1d,
                volumes_7d: cached.volumes_7d,
                volumes_30d: cached.volumes_30d,
                volumes_90d: cached.volumes_90d,
                volumes_365d: cached.volumes_365d,
                // All timeframe OHLC
                ohlc_1d: cached.ohlc_1d,
                ohlc_7d: cached.ohlc_7d,
                ohlc_14d: cached.ohlc_14d,
                ohlc_30d: cached.ohlc_30d,
                ohlc_90d: cached.ohlc_90d,
                ohlc_180d: cached.ohlc_180d,
                ohlc_365d: cached.ohlc_365d,
                // Legacy fields
                prices_24h: cached.prices_24h,
                market_caps_24h: cached.market_caps_24h,
                volumes_24h: cached.volumes_24h,
                ohlc_24h: cached.ohlc_24h,
            };
        });
    }
    catch (error) {
        console.error('Error fetching trading data from cache:', error);
        return null;
    }
}
/**
 * Save trading data to cache
 */
async function saveTradingDataToCache(data) {
    try {
        await (0, mongo_1.withMongoDB)(async (client) => {
            const db = client.db('trackerfi');
            const collection = db.collection('trading_cache');
            await collection.updateOne({ id: data.id }, { $set: data }, { upsert: true });
        });
    }
    catch (error) {
        console.error('Error saving trading data to cache:', error);
        // Don't throw - caching failure shouldn't break the request
    }
}
exports.default = getTokenTradingData;
