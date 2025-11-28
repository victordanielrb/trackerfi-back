"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAllTokens = setAllTokens;
exports.getAllTokens = getAllTokens;
const axios_1 = __importDefault(require("axios"));
const mongo_1 = require("../../mongo");
/**
 * Fetch full CoinGecko token list and upsert a slim version into Mongo.
 * Large list (~14k). Only perform when explicitly requested to avoid heavy writes.
 */
async function setAllTokens() {
    const url = 'https://api.coingecko.com/api/v3/coins/list?include_platform=false';
    console.log('📥 Fetching CoinGecko coins list...');
    const { data } = await axios_1.default.get(url, { timeout: 30000 });
    if (!Array.isArray(data))
        throw new Error('Unexpected CoinGecko response for coins list');
    const now = new Date().toISOString();
    const mapped = data.map((c) => ({
        id: c.id,
        name: c.name,
        symbol: (c.symbol || '').toUpperCase(),
        address: '',
        chain: 'coingecko',
        position_type: 'spot',
        updated_at: now,
    }));
    const result = await (0, mongo_1.withMongoDB)(async (client) => {
        const db = client.db('trackerfi');
        const collection = db.collection('alltokens');
        // Process in smaller batches to avoid timeouts
        const batchSize = 1000;
        let totalInserted = 0;
        let totalUpserted = 0;
        for (let i = 0; i < mapped.length; i += batchSize) {
            const batch = mapped.slice(i, i + batchSize);
            const bulk = batch.map(t => ({
                updateOne: {
                    filter: { id: t.id },
                    update: { $set: t },
                    upsert: true
                }
            }));
            console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(mapped.length / batchSize)} (${batch.length} tokens)`);
            const bulkResult = await collection.bulkWrite(bulk, { ordered: false });
            totalInserted += bulkResult.insertedCount || 0;
            totalUpserted += bulkResult.upsertedCount || 0;
            console.log(`   ✅ Batch completed: ${bulkResult.matchedCount} matched, ${bulkResult.upsertedCount} upserted`);
        }
        console.log(`🎉 All tokens processed: ${totalInserted} inserted, ${totalUpserted} upserted`);
        return { inserted: totalInserted, upserts: totalUpserted };
    });
    return result;
}
/**
 * Retrieve tokens from DB with optional search by symbol/name (case-insensitive regex).
 * Database should be populated via setAllTokens() first (e.g., via scheduled job).
 */
async function getAllTokens(search, limit = 50) {
    console.log('🔍 getAllTokens called with search:', search, 'limit:', limit);
    return (0, mongo_1.withMongoDB)(async (client) => {
        const db = client.db('trackerfi');
        const collection = db.collection('alltokens');
        console.log('📊 Using database: trackerfi, collection: alltokens');
        const query = search
            ? {
                $or: [
                    { symbol: { $regex: search, $options: 'i' } },
                    { name: { $regex: search, $options: 'i' } },
                    { id: { $regex: search, $options: 'i' } }
                ]
            }
            : {};
        console.log('🔎 Query:', JSON.stringify(query));
        const cursor = collection.find(query).limit(Math.min(limit, 200));
        const list = await cursor.toArray();
        // Sort results by relevance if search is provided
        if (search && list.length > 0) {
            const searchLower = search.toLowerCase();
            list.sort((a, b) => {
                // Exact symbol match gets highest priority
                const aSymbolExact = a.symbol?.toLowerCase() === searchLower ? 1 : 0;
                const bSymbolExact = b.symbol?.toLowerCase() === searchLower ? 1 : 0;
                if (aSymbolExact !== bSymbolExact)
                    return bSymbolExact - aSymbolExact;
                // Symbol starts with search gets second priority
                const aSymbolStarts = a.symbol?.toLowerCase().startsWith(searchLower) ? 1 : 0;
                const bSymbolStarts = b.symbol?.toLowerCase().startsWith(searchLower) ? 1 : 0;
                if (aSymbolStarts !== bSymbolStarts)
                    return bSymbolStarts - aSymbolStarts;
                // Exact name match gets third priority
                const aNameExact = a.name?.toLowerCase() === searchLower ? 1 : 0;
                const bNameExact = b.name?.toLowerCase() === searchLower ? 1 : 0;
                if (aNameExact !== bNameExact)
                    return bNameExact - aNameExact;
                // Name starts with search gets fourth priority
                const aNameStarts = a.name?.toLowerCase().startsWith(searchLower) ? 1 : 0;
                const bNameStarts = b.name?.toLowerCase().startsWith(searchLower) ? 1 : 0;
                if (aNameStarts !== bNameStarts)
                    return bNameStarts - aNameStarts;
                // Finally sort alphabetically by symbol
                return (a.symbol || '').localeCompare(b.symbol || '');
            });
        }
        console.log(`📋 Found ${list.length} results from alltokens collection`);
        return list;
    });
}
