"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidObjectId = exports.fromObjectId = exports.toObjectId = void 0;
const mongodb_1 = require("mongodb");
/**
 * Safely convert string to MongoDB ObjectId
 * @param id - String ID to convert
 * @returns ObjectId if valid, null if invalid
 */
const toObjectId = (id) => {
    try {
        if (mongodb_1.ObjectId.isValid(id)) {
            return new mongodb_1.ObjectId(id);
        }
        return null;
    }
    catch (error) {
        return null;
    }
};
exports.toObjectId = toObjectId;
/**
 * Convert ObjectId to string safely
 * @param id - ObjectId to convert
 * @returns String representation of ObjectId
 */
const fromObjectId = (id) => {
    return id.toString();
};
exports.fromObjectId = fromObjectId;
/**
 * Check if a string is a valid ObjectId
 * @param id - String to validate
 * @returns Boolean indicating if valid ObjectId
 */
const isValidObjectId = (id) => {
    return mongodb_1.ObjectId.isValid(id);
};
exports.isValidObjectId = isValidObjectId;
