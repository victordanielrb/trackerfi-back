import { Request } from 'express';
import mongo from '../../mongo';
import { toObjectId } from '../../utils/mongodb';

const getUserProfile = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
        const userId = req.params.userId;

        const objectId = toObjectId(userId);
        if (!objectId) {
            return { message: "Invalid user ID format", status: 400 };
        }

        const user = await database.collection("users").findOne({ _id: objectId });
        
        if (!user) {
            return { message: "User not found", status: 404 };
        }

        // Remove sensitive information
        const { password_hash, temp_password, twitter_access_token, twitter_refresh_token, ...sanitizedUser } = user;
        
        // Add additional info based on user type
        let additionalInfo = {};
        
        if (user.user_type === 'CREATOR') {
            // Get campaign statistics for creators
            const campaignStats = await database.collection("campaigns").aggregate([
                { $match: { creator_id: userId } },
                {
                    $group: {
                        _id: null,
                        totalCampaigns: { $sum: 1 },
                        activeCampaigns: {
                            $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] }
                        },
                        completedCampaigns: {
                            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] }
                        },
                        totalBudget: { $sum: "$total_prize_pool" }
                    }
                }
            ]).toArray();

            additionalInfo = {
                campaignStats: campaignStats.length > 0 ? campaignStats[0] : {
                    totalCampaigns: 0,
                    activeCampaigns: 0,
                    completedCampaigns: 0,
                    totalBudget: 0
                }
            };
        } else if (user.user_type === 'HOST') {
            // Get participation statistics for hosts
            const participationStats = await database.collection("campaign_participants").aggregate([
                { $match: { user_id: userId } },
                {
                    $lookup: {
                        from: "campaigns",
                        localField: "campaign_id",
                        foreignField: "_id",
                        as: "campaign"
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalParticipations: { $sum: 1 },
                        activeParticipations: {
                            $sum: { 
                                $cond: [
                                    { $eq: [{ $arrayElemAt: ["$campaign.status", 0] }, "ACTIVE"] }, 
                                    1, 
                                    0
                                ] 
                            }
                        }
                    }
                }
            ]).toArray();

            additionalInfo = {
                participationStats: participationStats.length > 0 ? participationStats[0] : {
                    totalParticipations: 0,
                    activeParticipations: 0
                }
            };
        }

        return { 
            message: {
                ...sanitizedUser,
                id: user._id.toString(),
                ...additionalInfo
            }, 
            status: 200 
        };
    } catch (error) {
        console.error("Error retrieving user profile:", error);
        return { message: "Error retrieving user profile", status: 500 };
    } finally {
        await client.close();
    }
};

export default getUserProfile;
