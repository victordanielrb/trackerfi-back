"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = updateUser;
// Update a user by ID
const mongodb_1 = require("mongodb");
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = 'trackerfi';
const collectionName = 'users';
async function updateUser(userId, updateData) {
    const client = new mongodb_1.MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const users = db.collection(collectionName);
        const result = await users.updateOne({ _id: new mongodb_1.ObjectId(userId) }, { $set: updateData });
        return result.modifiedCount > 0;
    }
    finally {
        await client.close();
    }
}
