// Get a user by ID
import { ObjectId } from 'mongodb';
import { getDb } from '../../mongo';

export async function getUser(userId: string) {
    const db = await getDb();
    const users = db.collection('users');
    const user = await users.findOne({ _id: new ObjectId(userId) });
    return user;
}
