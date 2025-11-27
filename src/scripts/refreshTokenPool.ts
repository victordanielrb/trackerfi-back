/**
 * Script to refresh token pool from CoinGecko API.
 * This script is intended to be run by GitHub Actions or manually.
 */
import 'dotenv/config';
import { refreshTokenPool } from '../functions/tokenRelated/tokenPooling';

async function main() {
	try {
		console.log('🚀 Starting token pool refresh script...');
		const result = await refreshTokenPool();
		console.log('✅ Script completed successfully');
		console.log(`   Upserts: ${result.upserts}`);
		console.log(`   Inserts: ${result.inserted}`);
		process.exit(0);
	} catch (error) {
		console.error('❌ Script failed:', error);
		process.exit(1);
	}
}

main();
