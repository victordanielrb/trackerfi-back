"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Script to refresh token pool from CoinGecko API.
 * This script is intended to be run by GitHub Actions or manually.
 */
require("dotenv/config");
const tokenPooling_1 = require("../functions/tokenRelated/tokenPooling");
async function main() {
    try {
        console.log('🚀 Starting token pool refresh script...');
        const result = await (0, tokenPooling_1.refreshTokenPool)();
        console.log('✅ Script completed successfully');
        console.log(`   Upserts: ${result.upserts}`);
        console.log(`   Inserts: ${result.inserted}`);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
}
main();
