import { Request } from 'express';
import mongo from '../../mongo';
import { toObjectId } from '../../utils/mongodb';

const getCampaignsByParticipant = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
        const participantId = req.params.participantId;

        const objectId = toObjectId(participantId);
        if (!objectId) {
            return { message: "Invalid participant ID", status: 400 };
        }

        // Verify participant exists and is of type CREATOR
        const participant = await database.collection("users").findOne({ 
            _id: objectId,
            user_type: 'CREATOR'
        });
        if (!participant) {
            return { message: "Participant not found or invalid user type", status: 404 };
        }

        // Get campaign participations for this user
        const participations = await database.collection("campaign_participants")
            .find({ user_id: participantId })
            .sort({ joined_at: -1 })
            .toArray();

        if (participations.length === 0) {
            return { 
                message: {
                    campaigns: [],
                    participant_info: {
                        id: participant._id.toString(),
                        username: participant.username || participant.twitter_username,
                        user_type: participant.user_type
                    },
                    total_count: 0
                }, 
                status: 200 
            };
        }

        // Get campaign IDs
        const campaignIds = participations.map((p: any) => toObjectId(p.campaign_id));

        // Get campaigns
        const campaigns = await database.collection("campaigns")
            .find({ _id: { $in: campaignIds } })
            .sort({ created_at: -1 })
            .toArray();

        // Enrich campaigns with participation and additional data
        const enrichedCampaigns = await Promise.all(
            campaigns.map(async (campaign: any) => {
                // Find this user's participation data
                const userParticipation = participations.find((p: any) => p.campaign_id === campaign._id.toString());
                
                // Count total participants
                const participantCount = await database.collection("campaign_participants")
                    .countDocuments({ campaign_id: campaign._id.toString() });
                
                // Count user's submissions for this campaign
                const userSubmissionCount = await database.collection("submissions")
                    .countDocuments({ 
                        campaign_id: campaign._id.toString(),
                        user_id: participantId
                    });

                // Get host information
                const host = await database.collection("users")
                    .findOne({ _id: toObjectId(campaign.host_id) }, { projection: { username: 1, user_type: 1 } });

                // Calculate days remaining
                const endDate = campaign.end_date || campaign.deadline;
                const daysRemaining = endDate ? 
                    Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
                    null;

                return {
                    ...campaign,
                    id: campaign._id.toString(),
                    participant_count: participantCount,
                    user_submission_count: userSubmissionCount,
                    participation_data: {
                        joined_at: userParticipation?.joined_at,
                        status: userParticipation?.status || 'ACTIVE'
                    },
                    host_info: host ? {
                        id: host._id.toString(),
                        username: host.username,
                        user_type: host.user_type
                    } : null,
                    days_remaining: daysRemaining
                };
            })
        );

        return { 
            message: {
                campaigns: enrichedCampaigns,
                participant_info: {
                    id: participant._id.toString(),
                    username: participant.username || participant.twitter_username,
                    user_type: participant.user_type
                },
                total_count: enrichedCampaigns.length
            }, 
            status: 200 
        };
    } catch (error) {
        console.error("Error retrieving campaigns by participant:", error);
        return { message: "Error retrieving campaigns by participant", status: 500 };
    } finally {
        await client.close();
    }
};

export default getCampaignsByParticipant;
