"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMongoClient = createMongoClient;
exports.withMongoDB = withMongoDB;
exports.default = mongo;
var mongodb_1 = require("mongodb");
const { env } = require("process");
var uri = process.env.MONGO_URI|| env.MONGO_URI;

console.log('Environment check:', {
    MONGO_URI_exists: !!process.env.MONGO_URI,
    MONGO_URI_length: ((_a = process.env.MONGO_URI) === null || _a === void 0 ? void 0 : _a.length) || 0
});
if (!uri) {
    console.error('❌ MONGO_URI environment variable is not defined');
    console.error('Available env vars:', Object.keys(process.env).filter(function (key) { return key.includes('MONGO'); }));
    throw new Error('MONGO_URI environment variable is required');
}
// Function to create a new MongoDB client for each operation
function createMongoClient() {
    return new mongodb_1.MongoClient(uri, {
        serverApi: {
            version: mongodb_1.ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
        serverSelectionTimeoutMS: 105000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 15000,
        maxPoolSize: 2,
        minPoolSize: 1,
        retryWrites: true,
        retryReads: true,
        family: 4, // Force IPv4
        directConnection: false,
    });
}
// Helper function for database operations
function withMongoDB(operation) {
    return __awaiter(this, void 0, void 0, function () {
        var client, result, error_1, closeError_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    client = createMongoClient();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 10]);
                    console.log('🔄 Connecting to MongoDB...');
                    return [4 /*yield*/, client.connect()];
                case 2:
                    _a.sent();
                    // Test the connection
                    return [4 /*yield*/, client.db('admin').command({ ping: 1 })];
                case 3:
                    // Test the connection
                    _a.sent();
                    console.log('✅ MongoDB connected successfully');
                    return [4 /*yield*/, operation(client)];
                case 4:
                    result = _a.sent();
                    return [2 /*return*/, result];
                case 5:
                    error_1 = _a.sent();
                    console.error('❌ MongoDB operation failed:', error_1);
                    throw error_1;
                case 6:
                    _a.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, client.close()];
                case 7:
                    _a.sent();
                    console.log('📴 MongoDB connection closed');
                    return [3 /*break*/, 9];
                case 8:
                    closeError_1 = _a.sent();
                    console.error('Error closing MongoDB connection:', closeError_1);
                    return [3 /*break*/, 9];
                case 9: return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    });
}
// Legacy function for backward compatibility
function mongo() {
    return createMongoClient();
}
