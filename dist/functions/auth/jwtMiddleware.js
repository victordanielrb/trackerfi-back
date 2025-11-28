"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const jwtUtil_1 = require("./jwtUtil");
// Express middleware to authenticate JWT and attach payload to req.user
function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'Access token required' });
        }
        const decoded = (0, jwtUtil_1.verifyToken)(token);
        if (!decoded) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }
        // attach user payload
        req.user = decoded;
        next();
    }
    catch (err) {
        console.error('JWT middleware error:', err);
        return res.status(500).json({ success: false, message: 'Token verification failed' });
    }
}
exports.default = authenticateToken;
