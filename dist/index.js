"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
// Import functions
const filterTokens_1 = __importDefault(require("./functions/tokenRelated/filterTokens"));
const getTokensFromWallet_1 = __importDefault(require("./functions/wallets/getTokensFromWallet"));
const setTokenData_1 = __importDefault(require("./functions/tokenRelated/setTokenData"));
const setPriceTokens_1 = __importDefault(require("./functions/tokenRelated/setPriceTokens"));
const checkAlerts_1 = __importDefault(require("./functions/alerts/checkAlerts"));
const wsServer_1 = __importDefault(require("./functions/alerts/wsServer"));
const node_http_1 = __importDefault(require("node:http"));
const createUser_1 = require("./functions/userRelated/createUser");
const deleteUser_1 = require("./functions/userRelated/deleteUser");
const getUser_1 = require("./functions/userRelated/getUser");
const updateUser_1 = require("./functions/userRelated/updateUser");
const getAllWallets_1 = __importDefault(require("./functions/wallets/getAllWallets"));
const auth_1 = __importDefault(require("./routes/auth"));
const wallets_1 = __importDefault(require("./routes/wallets"));
const tracking_1 = __importDefault(require("./routes/tracking"));
const globaldata_1 = __importDefault(require("./routes/globaldata"));
const exchange_1 = __importDefault(require("./routes/exchange"));
const tokens_1 = __importDefault(require("./routes/tokens"));
const users_1 = __importDefault(require("./routes/users"));
const tokenPooling_1 = require("./functions/tokenRelated/tokenPooling");
const app = (0, express_1.default)();
const server = node_http_1.default.createServer(app);
// Middleware
app.use(express_1.default.json());
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)({
    origin: ['http://localhost:8081', 'http://localhost:3000', 'http://192.168.1.100:8081', 'http://localhost:8080', 'http://127.0.0.1:8081', '*'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use("/auth", auth_1.default);
app.use("/api/wallets", wallets_1.default);
app.use("/api/tracking", tracking_1.default);
app.use("/api/globaldata", globaldata_1.default);
app.use("/api/exchanges", exchange_1.default);
app.use("/api/tokens", tokens_1.default);
app.use("/api/users", users_1.default);
// Token-related routes
app.post('/filterTokens', (req, res) => {
    try {
        const tokens = req.body.tokens;
        const result = (0, filterTokens_1.default)(tokens);
        res.json(result);
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: errorMsg });
    }
});
app.get('/getTokensFromWallet', async (req, res) => {
    try {
        const result = await (0, getTokensFromWallet_1.default)(req.body.wallet);
        res.json(result);
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: errorMsg });
    }
});
// Removed the getTokensFromAllWallets route
app.post('/setPriceTokens', async (req, res) => {
    try {
        const { tokens, chain } = req.body;
        const result = await (0, setPriceTokens_1.default)(tokens, chain);
        res.json(result);
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: errorMsg });
    }
});
app.post('/setTokenData', (req, res) => {
    try {
        const tokens = req.body.tokens;
        (0, setTokenData_1.default)(tokens);
        res.json({ success: true });
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: errorMsg });
    }
});
// User-related routes
app.post('/createUser', async (req, res) => {
    try {
        const userData = req.body;
        const user = await (0, createUser_1.createUser)(userData);
        res.json(user);
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: errorMsg });
    }
});
app.delete('/deleteUser/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const success = await (0, deleteUser_1.deleteUser)(userId);
        res.json({ success });
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: errorMsg });
    }
});
app.get('/getUser/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await (0, getUser_1.getUser)(userId);
        res.json(user);
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: errorMsg });
    }
});
app.put('/updateUser/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const updateData = req.body;
        const success = await (0, updateUser_1.updateUser)(userId, updateData);
        res.json({ success });
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: errorMsg });
    }
});
// Health check route (should be first)
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'TrackerFi Backend is running' });
});
app.get('/wallets', async (req, res) => {
    try {
        const result = await (0, getAllWallets_1.default)();
        res.json(result);
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: errorMsg });
    }
});
// Wallet routes are handled by walletRouter
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        message: {
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        }
    });
});
// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
    console.log(`🚀 TrackerFi Backend running on port ${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth: http://localhost:${PORT}/auth/login`);
    console.log(`💼 Wallets: http://localhost:${PORT}/api/wallets`);
    // Start alerts polling (runs every 3 minutes)
    try {
        checkAlerts_1.default.startAlertsPolling();
    }
    catch (e) {
        console.warn('Failed to start alerts polling:', e);
    }
    // Initialize WebSocket server (used to notify frontend when alerts trigger)
    try {
        wsServer_1.default.initWebSocketServer(server);
    }
    catch (e) {
        console.warn('Failed to start websocket server:', e);
    }
    // Initialize token pool on startup
    try {
        await (0, tokenPooling_1.initializeTokenPool)();
    }
    catch (e) {
        console.warn('Failed to initialize token pool:', e);
    }
});
