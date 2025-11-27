"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jwtMiddleware_1 = require("../functions/auth/jwtMiddleware");
const addExchange_1 = __importDefault(require("../functions/userExchange/addExchange"));
const getUserExchanges_1 = __importDefault(require("../functions/userExchange/getUserExchanges"));
const updateExchange_1 = __importDefault(require("../functions/userExchange/updateExchange"));
const deleteExchange_1 = __importDefault(require("../functions/userExchange/deleteExchange"));
const getExchangeForEdit_1 = __importDefault(require("../functions/userExchange/getExchangeForEdit"));
const getUserFuturesPositions_1 = __importDefault(require("../functions/userExchange/getUserFuturesPositions"));
const router = express_1.default.Router();
// Middleware to verify JWT token for all exchange routes
router.use(jwtMiddleware_1.authenticateToken);
// POST /api/exchanges - Add new exchange
router.post('/', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID not found in token'
            });
        }
        const { name, api_key, api_secret } = req.body;
        if (!name || !api_key || !api_secret) {
            return res.status(400).json({
                success: false,
                message: 'Exchange name, API key, and API secret are required'
            });
        }
        const result = await (0, addExchange_1.default)(userId, { name, api_key, api_secret });
        if (result.success) {
            return res.status(201).json(result);
        }
        else {
            return res.status(400).json(result);
        }
    }
    catch (error) {
        console.error('Error adding exchange:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// GET /api/exchanges - Get all user exchanges
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID not found in token'
            });
        }
        const result = await (0, getUserExchanges_1.default)(userId);
        if (result.success) {
            return res.status(200).json(result);
        }
        else {
            return res.status(404).json(result);
        }
    }
    catch (error) {
        console.error('Error getting user exchanges:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// GET /api/exchanges/futures - Get user futures positions from all exchanges
router.get('/futures', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID not found in token'
            });
        }
        const result = await (0, getUserFuturesPositions_1.default)(userId);
        if (result.success) {
            return res.status(200).json(result);
        }
        else {
            return res.status(404).json(result);
        }
    }
    catch (error) {
        console.error('Error getting futures positions:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// GET /api/exchanges/:exchangeId/edit - Get exchange for editing (with decrypted credentials)
router.get('/:exchangeId/edit', async (req, res) => {
    try {
        const { exchangeId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID not found in token'
            });
        }
        // Verify the exchange belongs to the authenticated user
        if (!exchangeId.startsWith(userId + '-')) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this exchange'
            });
        }
        const result = await (0, getExchangeForEdit_1.default)(exchangeId);
        if (result.success) {
            return res.status(200).json(result);
        }
        else {
            return res.status(404).json(result);
        }
    }
    catch (error) {
        console.error('Error getting exchange for edit:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// PUT /api/exchanges/:exchangeId - Update exchange
router.put('/:exchangeId', async (req, res) => {
    try {
        const { exchangeId } = req.params;
        const { api_key, api_secret } = req.body;
        if (!api_key && !api_secret) {
            return res.status(400).json({
                success: false,
                message: 'At least one field (api_key or api_secret) must be provided'
            });
        }
        const result = await (0, updateExchange_1.default)(exchangeId, { api_key, api_secret });
        if (result.success) {
            return res.status(200).json(result);
        }
        else {
            return res.status(400).json(result);
        }
    }
    catch (error) {
        console.error('Error updating exchange:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// DELETE /api/exchanges/:exchangeId - Delete exchange
router.delete('/:exchangeId', async (req, res) => {
    try {
        const { exchangeId } = req.params;
        const result = await (0, deleteExchange_1.default)(exchangeId);
        if (result.success) {
            return res.status(200).json(result);
        }
        else {
            return res.status(400).json(result);
        }
    }
    catch (error) {
        console.error('Error deleting exchange:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
