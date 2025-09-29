// Update a user by ID
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = 'trackerfi';
const collectionName = 'users';

export async function updateUser(userId: string, updateData: Partial<{ name: string; email: string; wallets: string[] }>) {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const users = db.collection(collectionName);
        const result = await users.updateOne(
            { _id: new ObjectId(userId) },
            { $set: updateData }
        );
        return result.modifiedCount > 0;
    } finally {
        await client.close();
    }
}
