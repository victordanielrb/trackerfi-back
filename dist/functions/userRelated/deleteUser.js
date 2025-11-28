"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = deleteUser;
// Delete a user by ID
const mongodb_1 = require("mongodb");
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = 'trackerfi';
const collectionName = 'users';
async function deleteUser(userId) {
    const client = new mongodb_1.MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const users = db.collection(collectionName);
        const result = await users.deleteOne({ _id: new mongodb_1.ObjectId(userId) });
        return result.deletedCount > 0;
    }
    finally {
        await client.close();
    }
}
