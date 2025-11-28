"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = exports.decodeToken = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET ?? '';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h'; // fallback to '1h' if not set
const secret = process.env.JWT_SECRET;
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign({
        data: payload
    }, secret, { expiresIn: "7d", issuer: 'trackerfi-api', audience: 'trackerfi-users' });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET, {
            issuer: 'trackerfi-api',
            audience: 'trackerfi-users',
        });
        // Extract the data property from the JWT payload
        return decoded.data;
    }
    catch (error) {
        console.error('JWT verification failed:', error);
        return null;
    }
};
exports.verifyToken = verifyToken;
const decodeToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        return decoded?.data;
    }
    catch (error) {
        console.error('JWT decode failed:', error);
        return null;
    }
};
exports.decodeToken = decodeToken;
const refreshToken = (token) => {
    const payload = (0, exports.verifyToken)(token);
    if (!payload)
        return null;
    // Remove exp, iat, iss, aud from payload before regenerating
    const { userId, username, email, twitter_username } = payload;
    return (0, exports.generateToken)({ userId, username, email, twitter_username });
};
exports.refreshToken = refreshToken;
