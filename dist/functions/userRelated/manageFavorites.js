"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTokenToFavorites = addTokenToFavorites;
exports.removeTokenFromFavorites = removeTokenFromFavorites;
exports.getUserFavorites = getUserFavorites;
exports.isTokenFavorite = isTokenFavorite;
const mongo_1 = require("../../mongo");
const mongodb_1 = require("mongodb");
/**
 * Add a token to user's favorites list
 */
async function addTokenToFavorites(userId, tokenId) {
    console.log('Adding token to favorites:', { userId, tokenId });
    return (0, mongo_1.withMongoDB)(async (client) => {
        const db = client.db('trackerfi');
        const collection = db.collection('users');
        const result = await collection.updateOne({ _id: new mongodb_1.ObjectId(userId) }, { $addToSet: { favorites: tokenId } });
        console.log('Update result:', result);
        return result.modifiedCount > 0 || result.matchedCount > 0;
    });
}
/**
 * Remove a token from user's favorites list
 */
async function removeTokenFromFavorites(userId, tokenId) {
    if (!tokenId)
        return false;
    if (!userId)
        return false;
    return (0, mongo_1.withMongoDB)(async (client) => {
        const db = client.db('trackerfi');
        const collection = db.collection('users');
        const result = await collection.updateOne({ _id: new mongodb_1.ObjectId(userId) }, { $pull: { favorites: tokenId } });
        return result.modifiedCount > 0;
    });
}
/**
 * Get user's favorite tokens with details
 */
async function getUserFavorites(userId) {
    return (0, mongo_1.withMongoDB)(async (client) => {
        const db = client.db('trackerfi');
        const usersCollection = db.collection('users');
        const tokensCollection = db.collection('alltokens');
        const user = await usersCollection.findOne({ _id: new mongodb_1.ObjectId(userId) }, { projection: { favorites: 1 } });
        const favorites = user?.favorites || [];
        if (favorites.length === 0) {
            return [];
        }
        console.log("user favorites:", favorites);
        // Get token details for favorites
        const favoriteTokens = await tokensCollection.find({
            id: { $in: favorites }
        }).toArray();
        return favoriteTokens;
    });
}
/**
 * Check if a token is in user's favorites
 */
async function isTokenFavorite(userId, tokenId) {
    return (0, mongo_1.withMongoDB)(async (client) => {
        const db = client.db('trackerfi');
        const collection = db.collection('users');
        const user = await collection.findOne({
            _id: new mongodb_1.ObjectId(userId),
            favorites: tokenId
        }, { projection: { _id: 1 } });
        return !!user;
    });
}
