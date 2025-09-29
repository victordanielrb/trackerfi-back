// Create a new user
import { MongoClient, ObjectId } from 'mongodb';
import User from '../../interfaces/userInterface';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = 'trackerfi';
const collectionName = 'users';

export async function createUser(userData: Omit<User, '_id'>): Promise<User> {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const users = db.collection(collectionName);
        const result = await users.insertOne(userData);
        return { ...userData, _id: result.insertedId.toString() };
    } finally {
        await client.close();
    }
}
