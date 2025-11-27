import { setAllTokens } from './setAllTokens';

/**
 * Token pooling job to refresh CoinGecko token list periodically.
 * This should be called by a scheduled job (e.g., GitHub Actions, cron).
 */
export async function refreshTokenPool() {
	console.log('🔄 Starting token pool refresh...');
	try {
		const result = await setAllTokens();
		console.log(`✅ Token pool refresh completed: ${result.upserts} upserts, ${result.inserted} new inserts`);
		return result;
	} catch (error) {
		console.error('❌ Token pool refresh failed:', error);
		throw error;
	}
}

/**
 * Initialize token pool on server startup if collection is empty.
 */
export async function initializeTokenPool() {
	const { withMongoDB } = await import('../../mongo');
	
	return withMongoDB(async client => {
		const db = client.db('trackerfi');
		const collection = db.collection('alltokens');
		const count = await collection.countDocuments();
		
		if (count === 0) {
			console.log('📦 Token pool is empty, initializing...');
			await setAllTokens();
			console.log('✅ Token pool initialized');
		} else {
			console.log(`✅ Token pool already contains ${count} tokens`);
		}
	});
}
