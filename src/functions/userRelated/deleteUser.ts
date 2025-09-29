// Delete a user by ID
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = 'trackerfi';
const collectionName = 'users';

export async function deleteUser(userId: string) {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const users = db.collection(collectionName);
        const result = await users.deleteOne({ _id: new ObjectId(userId) });
        return result.deletedCount > 0;
    } finally {
        await client.close();
    }
}
