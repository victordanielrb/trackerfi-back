import { Request } from 'express';
import mongo from '../../mongo';

const getAllSubmissions = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
        
        // Build filter based on query parameters
        const filter: any = {};
        
        if (req.query.status) {
            filter.status = req.query.status;
        }
        
        if (req.query.campaign_id) {
            filter.campaign_id = req.query.campaign_id;
        }
        
        if (req.query.user_id) {
            filter.user_id = req.query.user_id;
        }

        const submissions = await database.collection("submissions")
            .find(filter)
            .sort({ submitted_at: -1 })
            .toArray();

        const submissionsWithId = submissions.map((submission: any) => ({
            ...submission,
            id: submission._id.toString()
        }));

        return { message: submissionsWithId, status: 200 };
    } catch (error) {
        console.error("Error retrieving submissions:", error);
        return { message: "Error retrieving submissions", status: 500 };
    } finally {
        await client.close();
    }
};

export default getAllSubmissions;
