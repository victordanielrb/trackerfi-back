import { Request } from 'express';
import mongo from '../../mongo';
import { toObjectId } from '../../utils/mongodb';

const getCampaignsByHost = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
        const hostId = req.params.hostId;

        const objectId = toObjectId(hostId);
        if (!objectId) {
            return { message: "Invalid host ID", status: 400 };
        }

        // Verify host exists and is of type HOST
        const host = await database.collection("users").findOne({ 
            _id: objectId,
            user_type: 'HOST'
        });
        if (!host) {
            return { message: "Host not found or invalid user type", status: 404 };
        }

        // Get campaigns created by this host
        const campaigns = await database.collection("campaigns")
            .find({ host_id: hostId })
            .sort({ created_at: -1 })
            .toArray();

        // Enrich campaigns with additional data
        const enrichedCampaigns = await Promise.all(
            campaigns.map(async (campaign: any) => {
                // Count participants
                const participantCount = await database.collection("campaign_participants")
                    .countDocuments({ campaign_id: campaign._id.toString() });
                
                // Count submissions
                const submissionCount = await database.collection("submissions")
                    .countDocuments({ campaign_id: campaign._id.toString() });

                // Calculate days remaining
                const endDate = campaign.end_date || campaign.deadline;
                const daysRemaining = endDate ? 
                    Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
                    null;

                return {
                    ...campaign,
                    id: campaign._id.toString(),
                    participant_count: participantCount,
                    submission_count: submissionCount,
                    days_remaining: daysRemaining
                };
            })
        );

        return { 
            message: {
                campaigns: enrichedCampaigns,
                host_info: {
                    id: host._id.toString(),
                    username: host.username,
                    user_type: host.user_type
                },
                total_count: enrichedCampaigns.length
            }, 
            status: 200 
        };
    } catch (error) {
        console.error("Error retrieving campaigns by host:", error);
        return { message: "Error retrieving campaigns by host", status: 500 };
    } finally {
        await client.close();
    }
};

export default getCampaignsByHost;
