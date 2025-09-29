import { Request } from 'express';
import mongo from '../../mongo';
import { ObjectId } from 'mongodb';

interface CreateSubmissionRequest {
    campaign_id: string;
    submission_data: any;
    user_id: string;
}

const createSubmission = async (req: Request<{}, {}, CreateSubmissionRequest>) => {
    const client = mongo();
    try {
        const { campaign_id, submission_data, user_id } = req.body;
        
        await client.connect();
        const database = client.db("bounties");
        
        const newSubmission = {
            campaign_id,
            user_id,
            submission_data,
            status: 'PENDING',
            submitted_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        
        const result = await database.collection("submissions").insertOne(newSubmission);
        
        return { message: { _id: result.insertedId, ...newSubmission }, status: 201 };
    } catch (error) {
        console.error("Error creating submission:", error);
        return { message: "Error creating submission", status: 500 };
    } finally {
        await client.close();
    }
};

export default createSubmission;
