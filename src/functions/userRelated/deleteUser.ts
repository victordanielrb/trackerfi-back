// Delete a user by ID
import { ObjectId } from 'mongodb';
import { getDb } from '../../mongo';

export async function deleteUser(userId: string) {
    const db = await getDb();
    const users = db.collection('users');
    const result = await users.deleteOne({ _id: new ObjectId(userId) });
    return result.deletedCount > 0;
}
