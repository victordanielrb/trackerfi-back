// Update a user by ID
import { ObjectId } from 'mongodb';
import { getDb } from '../../mongo';

export async function updateUser(userId: string, updateData: Partial<{ name: string; email: string; wallets: string[] }>) {
    const db = await getDb();
    const users = db.collection('users');
    const result = await users.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
    );
    return result.modifiedCount > 0;
}
