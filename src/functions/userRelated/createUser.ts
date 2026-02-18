// Create a new user
import User from '../../interfaces/userInterface';
import { getDb } from '../../mongo';

export async function createUser(userData: Omit<User, '_id'>): Promise<User> {
    const db = await getDb();
    const users = db.collection('users');
    const result = await users.insertOne(userData);
    return { ...userData, _id: result.insertedId.toString() };
}
