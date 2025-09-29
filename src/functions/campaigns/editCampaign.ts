import { Request } from 'express';
import mongo from '../../mongo';
import { ObjectId } from 'mongodb';

const editCampaign = async (req: Request) => {
    const client = mongo();
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        await client.connect();
        const database = client.db("bounties");
        
        const result = await database.collection("campaigns").updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...updateData, updated_at: new Date() } }
        );
        
        if (result.matchedCount === 0) {
            return { message: "Campaign not found", status: 404 };
        }
        
        const updatedCampaign = await database.collection("campaigns").findOne({ _id: new ObjectId(id) });
        return { message: updatedCampaign, status: 200 };
    } catch (error) {
        console.error("Error updating campaign:", error);
        return { message: "Error updating campaign", status: 500 };
    } finally {
        await client.close();
    }
};

export default editCampaign;
