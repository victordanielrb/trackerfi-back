import axios from 'axios';
import TokensFromWallet from '../../interfaces/tokenInterface';
import { getDb } from '../../mongo';

/**
 * Fetch full CoinGecko token list and upsert a slim version into Mongo.
 * Large list (~14k). Only perform when explicitly requested to avoid heavy writes.
 */
export async function setAllTokens(): Promise<{ inserted: number; upserts: number }> {
	const url = 'https://api.coingecko.com/api/v3/coins/list?include_platform=false';
	console.log('📥 Fetching CoinGecko coins list...');
	const { data } = await axios.get(url, { timeout: 30000 });
	if (!Array.isArray(data)) throw new Error('Unexpected CoinGecko response for coins list');

	const now = new Date().toISOString();
	const mapped: TokensFromWallet[] = data.map((c: any) => ({
		id: c.id,
		name: c.name,
		symbol: (c.symbol || '').toUpperCase(),
		address: '',
		chain: 'coingecko',
		position_type: 'spot',
		updated_at: now,
	}));

	const db = await getDb();
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

		console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(mapped.length/batchSize)} (${batch.length} tokens)`);
		const bulkResult = await collection.bulkWrite(bulk, { ordered: false });

		totalInserted += bulkResult.insertedCount || 0;
		totalUpserted += bulkResult.upsertedCount || 0;

		console.log(`   ✅ Batch completed: ${bulkResult.matchedCount} matched, ${bulkResult.upsertedCount} upserted`);
	}

	console.log(`🎉 All tokens processed: ${totalInserted} inserted, ${totalUpserted} upserted`);
	return { inserted: totalInserted, upserts: totalUpserted };
}

/**
 * Retrieve tokens from DB with optional search by symbol/name (case-insensitive regex).
 * Database should be populated via setAllTokens() first (e.g., via scheduled job).
 */
// Escape special regex characters to prevent ReDoS
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getAllTokens(search?: string, limit: number = 50) {
	const db = await getDb();
	const collection = db.collection('alltokens');

	const safeSearch = search ? escapeRegex(search.trim()) : null;
	const query = safeSearch
		? {
			$or: [
				{ symbol: { $regex: safeSearch, $options: 'i' } },
				{ name: { $regex: safeSearch, $options: 'i' } },
				{ id: { $regex: safeSearch, $options: 'i' } }
			]
		}
		: {};

	console.log('🔎 Query:', JSON.stringify(query));
	const cursor = collection.find(query).limit(Math.min(limit, 200));
	const list = await cursor.toArray();

	// Sort results by relevance if search is provided
	// Priority: exact name > exact ticker > has name match > has ticker match
	if (search && list.length > 0) {
		const searchLower = search.toLowerCase();
		list.sort((a, b) => {
			// 1. Exact name match (highest priority) - "ethereum" -> Ethereum first
			const aNameExact = a.name?.toLowerCase() === searchLower ? 1 : 0;
			const bNameExact = b.name?.toLowerCase() === searchLower ? 1 : 0;
			if (aNameExact !== bNameExact) return bNameExact - aNameExact;

			// 2. Exact ID match (for coingecko IDs like "ethereum", "bitcoin")
			const aIdExact = a.id?.toLowerCase() === searchLower ? 1 : 0;
			const bIdExact = b.id?.toLowerCase() === searchLower ? 1 : 0;
			if (aIdExact !== bIdExact) return bIdExact - aIdExact;

			// 3. Exact symbol/ticker match - "ETH" -> ETH first
			const aSymbolExact = a.symbol?.toLowerCase() === searchLower ? 1 : 0;
			const bSymbolExact = b.symbol?.toLowerCase() === searchLower ? 1 : 0;
			if (aSymbolExact !== bSymbolExact) return bSymbolExact - aSymbolExact;

			// 4. Name starts with search
			const aNameStarts = a.name?.toLowerCase().startsWith(searchLower) ? 1 : 0;
			const bNameStarts = b.name?.toLowerCase().startsWith(searchLower) ? 1 : 0;
			if (aNameStarts !== bNameStarts) return bNameStarts - aNameStarts;

			// 5. Symbol starts with search
			const aSymbolStarts = a.symbol?.toLowerCase().startsWith(searchLower) ? 1 : 0;
			const bSymbolStarts = b.symbol?.toLowerCase().startsWith(searchLower) ? 1 : 0;
			if (aSymbolStarts !== bSymbolStarts) return bSymbolStarts - aSymbolStarts;

			// 6. Name contains search
			const aNameContains = a.name?.toLowerCase().includes(searchLower) ? 1 : 0;
			const bNameContains = b.name?.toLowerCase().includes(searchLower) ? 1 : 0;
			if (aNameContains !== bNameContains) return bNameContains - aNameContains;

			// 7. Symbol contains search
			const aSymbolContains = a.symbol?.toLowerCase().includes(searchLower) ? 1 : 0;
			const bSymbolContains = b.symbol?.toLowerCase().includes(searchLower) ? 1 : 0;
			if (aSymbolContains !== bSymbolContains) return bSymbolContains - aSymbolContains;

			// Finally sort alphabetically by name
			return (a.name || '').localeCompare(b.name || '');
		});
	}

	console.log(`📋 Found ${list.length} results from alltokens collection`);
	return list;
}

