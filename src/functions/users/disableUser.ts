import { Request, Response } from 'express';
import mongo from '../../mongo';
import { toObjectId } from '../../utils/mongodb';

export default async function disableUser(req: Request, res: Response): Promise<Response> {
    const client = mongo();
    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        await client.connect();
        const database = client.db("bounties");
        
        const result = await database.collection("users").updateOne(
            { _id: objectId }, 
            { $set: { disabled: true } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ message: 'User disabled successfully' });
    } catch (error) {
        console.error("Error disabling user:", error);
        return res.status(500).json({ error: "Error disabling user" });
    } finally {
        await client.close();
    }
}
