"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenPool = refreshTokenPool;
exports.initializeTokenPool = initializeTokenPool;
const setAllTokens_1 = require("./setAllTokens");
/**
 * Token pooling job to refresh CoinGecko token list periodically.
 * This should be called by a scheduled job (e.g., GitHub Actions, cron).
 */
async function refreshTokenPool() {
    console.log('🔄 Starting token pool refresh...');
    try {
        const result = await (0, setAllTokens_1.setAllTokens)();
        console.log(`✅ Token pool refresh completed: ${result.upserts} upserts, ${result.inserted} new inserts`);
        return result;
    }
    catch (error) {
        console.error('❌ Token pool refresh failed:', error);
        throw error;
    }
}
/**
 * Initialize token pool on server startup if collection is empty.
 */
async function initializeTokenPool() {
    const { withMongoDB } = await Promise.resolve().then(() => __importStar(require('../../mongo')));
    return withMongoDB(async (client) => {
        const db = client.db('trackerfi');
        const collection = db.collection('alltokens');
        const count = await collection.countDocuments();
        if (count === 0) {
            console.log('📦 Token pool is empty, initializing...');
            await (0, setAllTokens_1.setAllTokens)();
            console.log('✅ Token pool initialized');
        }
        else {
            console.log(`✅ Token pool already contains ${count} tokens`);
        }
    });
}
