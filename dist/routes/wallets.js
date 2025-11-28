"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const addWallet_1 = __importDefault(require("../functions/wallets/addWallet"));
const deleteWallet_1 = __importDefault(require("../functions/wallets/deleteWallet"));
const getAllWallets_1 = __importDefault(require("../functions/wallets/getAllWallets"));
const getUserWallets_1 = __importDefault(require("../functions/wallets/getUserWallets"));
const getWalletById_1 = __importDefault(require("../functions/wallets/getWalletById"));
const updateWallet_1 = __importDefault(require("../functions/wallets/updateWallet"));
const getTokensFromWallet_1 = __importDefault(require("../functions/wallets/getTokensFromWallet"));
const jwtMiddleware_1 = require("../functions/auth/jwtMiddleware");
const router = (0, express_1.Router)();
// Use shared JWT middleware
// GET /api/wallets - Get all wallets (admin only)
router.get('/', jwtMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const result = await (0, getAllWallets_1.default)();
        if (result.status === 200) {
            // Handle both string and object message types
            const responseData = typeof result.message === 'object' && result.message.wallets
                ? result.message.wallets
                : [];
            res.status(200).json({
                success: true,
                data: responseData
            });
        }
        else {
            res.status(result.status).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('Get all wallets error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// GET /api/wallets/user/:userId - Get user's wallets
router.get('/user/:userId', jwtMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const result = await (0, getUserWallets_1.default)(req);
        if (result.status === 200) {
            // Handle both string and object message types
            const responseData = typeof result.message === 'object' && result.message.wallets
                ? result.message.wallets
                : [];
            res.status(200).json({
                success: true,
                data: responseData
            });
        }
        else {
            res.status(result.status).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('Get user wallets error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// GET /api/wallets/:walletId - Get wallet by ID
router.get('/:walletId', jwtMiddleware_1.authenticateToken, async (req, res) => {
    try {
        // Create a mock request object with the walletId in params.id
        const mockReq = { params: { id: req.params.walletId } };
        const result = await (0, getWalletById_1.default)(mockReq);
        if (result.status === 200) {
            res.status(200).json({
                success: true,
                data: result.message
            });
        }
        else {
            res.status(result.status).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('Get wallet by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// POST /api/wallets - Add new wallet
router.post('/', jwtMiddleware_1.authenticateToken, async (req, res) => {
    try {
        // Get user ID from the JWT token (it's stored in the 'userId' field)
        const user_id = req.user?.userId;
        const { blockchain, wallet_address } = req.body;
        if (!user_id) {
            console.error('User ID not found in token:', req.user);
            return res.status(401).json({
                success: false,
                message: 'User not authenticated - no user ID in token'
            });
        }
        if (!blockchain || !wallet_address) {
            return res.status(400).json({
                success: false,
                message: 'Blockchain and wallet address are required'
            });
        }
        console.log('Adding wallet for user:', user_id, 'blockchain:', blockchain, 'address:', wallet_address);
        const result = await (0, addWallet_1.default)(user_id, blockchain, wallet_address);
        if (result.status === 201) {
            res.status(201).json({
                success: true,
                data: result.message
            });
        }
        else {
            res.status(result.status).json({
                success: false,
                message: result.message.error || result.message
            });
        }
    }
    catch (error) {
        console.error('Add wallet error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// PUT /api/wallets/:walletId - Update wallet
router.put('/:walletId', jwtMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const { walletId } = req.params;
        const { wallet_address, blockchain } = req.body;
        if (!wallet_address && !blockchain) {
            return res.status(400).json({
                success: false,
                message: 'At least one field (wallet_address or blockchain) is required for update'
            });
        }
        // Create a mock request object
        const mockReq = { params: { id: walletId }, body: req.body };
        const result = await (0, updateWallet_1.default)(mockReq);
        if (result.status === 200) {
            res.status(200).json({
                success: true,
                data: result.message
            });
        }
        else {
            res.status(result.status).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('Update wallet error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// DELETE /api/wallets/:walletId - Delete wallet
router.delete('/:walletId', jwtMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const result = await (0, deleteWallet_1.default)(req.params.walletId);
        if (result.status === 200) {
            res.status(200).json({
                success: true,
                data: result.message
            });
        }
        else {
            res.status(result.status).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('Delete wallet error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// GET /api/wallets/:walletId/tokens - Get tokens from wallet
router.get('/:walletId/tokens', jwtMiddleware_1.authenticateToken, async (req, res) => {
    try {
        // First get the wallet to get the address
        const mockReq = { params: { id: req.params.walletId } };
        const walletResult = await (0, getWalletById_1.default)(mockReq);
        if (walletResult.status !== 200) {
            return res.status(walletResult.status).json({
                success: false,
                message: walletResult.message
            });
        }
        const wallet = walletResult.message;
        const tokens = await (0, getTokensFromWallet_1.default)(wallet.wallet_address);
        res.status(200).json({
            success: true,
            data: {
                wallet_address: wallet.wallet_address,
                blockchain: wallet.blockchain,
                tokens: tokens
            }
        });
    }
    catch (error) {
        console.error('Get wallet tokens error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
