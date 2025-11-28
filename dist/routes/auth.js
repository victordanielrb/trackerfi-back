"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const login_1 = __importDefault(require("../functions/auth/login"));
const register_1 = __importDefault(require("../functions/auth/register"));
const jwtMiddleware_1 = require("../functions/auth/jwtMiddleware");
const router = (0, express_1.Router)();
// POST /auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, and password are required'
            });
        }
        const result = await (0, register_1.default)(email, password, username);
        if (result.success) {
            res.status(201).json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        const result = await (0, login_1.default)(email, password);
        if (result.success) {
            res.status(200).json(result);
        }
        else {
            res.status(401).json(result);
        }
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// GET /auth/verify
router.get('/verify', jwtMiddleware_1.authenticateToken, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
            user: req.user
        }
    });
});
exports.default = router;
