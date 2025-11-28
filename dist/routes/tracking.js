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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jwtMiddleware_1 = require("../functions/auth/jwtMiddleware");
const addTrackedWallet_1 = __importDefault(require("../functions/userRelated/addTrackedWallet"));
const removeTrackedWallet_1 = __importDefault(require("../functions/userRelated/removeTrackedWallet"));
const getUserTrackedWallets_1 = __importDefault(require("../functions/userRelated/getUserTrackedWallets"));
const getTokensFromTrackedWallets_1 = __importDefault(require("../functions/userRelated/getTokensFromTrackedWallets"));
const addAlert_1 = __importDefault(require("../functions/alerts/addAlert"));
const getWalletTransactions_1 = __importDefault(require("../functions/wallets/getWalletTransactions"));
const router = express_1.default.Router();
// Use shared JWT middleware
// Get user's tracked wallets
router.get('/wallets', jwtMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const wallets = await (0, getUserTrackedWallets_1.default)(userId);
        res.json(wallets);
    }
    catch (error) {
        console.error('Error getting tracked wallets:', error);
        res.status(500).json({ error: 'Failed to get tracked wallets' });
    }
});
// Add wallet to tracking list
router.post('/wallets', jwtMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { address, chain } = req.body;
        if (!address || !chain) {
            return res.status(400).json({ error: 'Address and chain are required' });
        }
        const result = await (0, addTrackedWallet_1.default)(userId, address, chain);
        res.json(result);
    }
    catch (error) {
        console.error('Error adding tracked wallet:', error);
        if (error.message === 'Wallet already tracked by this user') {
            res.status(409).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to add tracked wallet' });
        }
    }
});
// Remove wallet from tracking list
router.delete('/wallets', jwtMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { address, chain } = req.body;
        if (!address || !chain) {
            return res.status(400).json({ error: 'Address and chain are required' });
        }
        const result = await (0, removeTrackedWallet_1.default)(userId, address, chain);
        res.json(result);
    }
    catch (error) {
        console.error('Error removing tracked wallet:', error);
        if (error.message === 'Wallet not found in tracking list') {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to remove tracked wallet' });
        }
    }
});
// Get tokens from all tracked wallets
router.get('/tokens', jwtMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const tokens = await (0, getTokensFromTrackedWallets_1.default)(userId);
        res.json(tokens);
    }
    catch (error) {
        console.error('Error getting tokens from tracked wallets:', error);
        res.status(500).json({ error: 'Failed to get tokens from tracked wallets' });
    }
});
// Get transactions from a specific wallet
router.get('/wallets/:address/transactions', jwtMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { address } = req.params;
        const { chain, cursor } = req.query;
        if (!address) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }
        // Verify that the user has this wallet in their tracked wallets
        const userWallets = await (0, getUserTrackedWallets_1.default)(userId);
        const isWalletTracked = userWallets.wallets.some((wallet) => wallet.address.toLowerCase() === address.toLowerCase() &&
            (!chain || wallet.chain === chain));
        if (!isWalletTracked) {
            return res.status(403).json({ error: 'Wallet not found in your tracking list' });
        }
        const result = await (0, getWalletTransactions_1.default)(address, chain, cursor);
        res.json({
            wallet_address: address,
            chain: chain || 'all',
            transactions: result.transactions,
            next_cursor: result.nextCursor,
            total_count: result.transactions.length
        });
    }
    catch (error) {
        console.error('Error getting wallet transactions:', error);
        if (error.message.includes('not found')) {
            res.status(404).json({ error: 'Wallet not found or no transactions available' });
        }
        else if (error.message.includes('API key')) {
            res.status(503).json({ error: 'Transaction service temporarily unavailable' });
        }
        else {
            res.status(500).json({ error: 'Failed to get wallet transactions' });
        }
    }
});
// Get user's alerts
router.get('/alerts', jwtMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await (await Promise.resolve().then(() => __importStar(require('../functions/userRelated/getUser')))).getUser(userId);
        res.json({ alerts: user?.alerts || [] });
    }
    catch (error) {
        console.error('Error getting user alerts:', error);
        res.status(500).json({ error: 'Failed to get alerts' });
    }
});
// Create a new alert for the authenticated user
router.post('/alerts', jwtMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { token, price_threshold, alert_type } = req.body;
        if (!token || !price_threshold || !alert_type) {
            return res.status(400).json({ error: 'token, price_threshold and alert_type are required' });
        }
        const result = await (0, addAlert_1.default)(userId, { token, price_threshold, alert_type });
        res.json({ success: true, result });
    }
    catch (error) {
        console.error('Error creating alert:', error);
        res.status(500).json({ error: 'Failed to create alert' });
    }
});
exports.default = router;
