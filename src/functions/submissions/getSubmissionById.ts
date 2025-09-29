import { Request } from 'express';
import mongo from '../../mongo';
import { toObjectId } from '../../utils/mongodb';

const getSubmissionById = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
                const submissionId = req.params.id;

        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            return { message: "Invalid submission ID", status: 400 };
        }

        const submission = await database.collection("submissions").findOne({ _id: objectId });
        
        if (!submission) {
            return { message: "Submission not found", status: 404 };
        }

        return { 
            message: {
                ...submission,
                id: submission._id.toString()
            }, 
            status: 200 
        };
    } catch (error) {
        console.error("Error retrieving submission:", error);
        return { message: "Error retrieving submission", status: 500 };
    } finally {
        await client.close();
    }
};

export default getSubmissionById;

