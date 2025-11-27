"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jwtMiddleware_1 = require("../functions/auth/jwtMiddleware");
const setAllTokens_1 = require("../functions/tokenRelated/setAllTokens");
const getTokenDetails_1 = require("../functions/tokenRelated/getTokenDetails");
const getTokenTradingData_1 = require("../functions/tokenRelated/getTokenTradingData");
const router = express_1.default.Router();
/**
 * GET /api/tokens/all
 * Query params:
 *  - search: filter by symbol or name (regex, case-insensitive)
 *  - limit: max number of results (default 50, max 200)
 */
router.get('/all', async (req, res) => {
    try {
        const { search, limit } = req.query;
        console.log("search", search);
        const list = await (0, setAllTokens_1.getAllTokens)(search, limit ? parseInt(limit, 10) : 50);
        console.log("list", list);
        res.json({ count: list.length, tokens: list });
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: errorMsg });
    }
});
/**
 * POST /api/tokens/all/refresh
 * Heavy operation (upserts ~14k entries). Protected.
 */
router.post('/all/refresh', jwtMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const result = await (0, setAllTokens_1.setAllTokens)();
        res.json({ success: true, ...result });
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: errorMsg });
    }
});
/**
 * GET /api/tokens/details/:id
 * Returns mapped token detail (single snapshot)
 */
router.get('/details/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const details = await (0, getTokenDetails_1.getTokenDetails)(id);
        if (!details)
            return res.status(404).json({ error: 'Token not found' });
        res.json(details);
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: errorMsg });
    }
});
/**
 * GET /api/tokens/trading/:id
 * Combines price, changes, 24h chart arrays and OHLC.
 */
router.get('/trading/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = await (0, getTokenTradingData_1.getTokenTradingData)(id);
        if (!data)
            return res.status(404).json({ error: 'Token not found or no trading data' });
        res.json(data);
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: errorMsg });
    }
});
exports.default = router;
