"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
// Create a new user
const mongodb_1 = require("mongodb");
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = 'trackerfi';
const collectionName = 'users';
async function createUser(userData) {
    const client = new mongodb_1.MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const users = db.collection(collectionName);
        const result = await users.insertOne(userData);
        return { ...userData, _id: result.insertedId.toString() };
    }
    finally {
        await client.close();
    }
}
