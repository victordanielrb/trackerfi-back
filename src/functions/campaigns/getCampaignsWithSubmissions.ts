import { Request } from 'express';
import mongo from '../../mongo';
import { toObjectId } from '../../utils/mongodb';

const getCampaignsWithSubmissions = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
        const creatorId = req.params.creatorId;

        const objectId = toObjectId(creatorId);
        if (!objectId) {
            return { 
                message: { 
                    success: false, 
                    message: "Invalid creator ID" 
                }, 
                status: 400 
            };
        }

        // Verify creator exists
        const creator = await database.collection("users").findOne({ _id: objectId });
        if (!creator) {
            return { 
                message: { 
                    success: false, 
                    message: "Creator not found" 
                }, 
                status: 404 
            };
        }

        // Find all submissions by this creator
        const submissions = await database.collection("submissions")
            .find({ user_id: objectId })
            .toArray();

        if (submissions.length === 0) {
            return { 
                message: { 
                    success: true, 
                    data: [],
                    message: "No submissions found for this creator"
                }, 
                status: 200 
            };
        }

        // Extract unique campaign IDs from submissions
        const campaignIds = [...new Set(submissions.map((submission: any) => submission.campaign_id))];
        const campaignObjectIds = campaignIds
            .map((id: any) => toObjectId(id.toString()))
            .filter((id: any) => id !== null);

        // Get campaigns where creator has submissions with additional submission info
        const campaignsAggregation = await database.collection("campaigns").aggregate([
            {
                $match: {
                    _id: { $in: campaignObjectIds }
                }
            },
            {
                $lookup: {
                    from: 'submissions',
                    let: { campaignId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$campaign_id', '$$campaignId'] },
                                        { $eq: ['$user_id', objectId] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                status: 1,
                                score: 1,
                                submitted_at: 1,
                                reviewed_at: 1,
                                feedback: 1,
                                submission_data: 1
                            }
                        }
                    ],
                    as: 'my_submissions'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'host_id',
                    foreignField: '_id',
                    as: 'host_info'
                }
            },
            {
                $addFields: {
                    id: { $toString: '$_id' },
                    host_id: { $toString: '$host_id' },
                    submission_count: { $size: '$my_submissions' },
                    latest_submission: { $max: '$my_submissions.submitted_at' },
                    submission_status: { $arrayElemAt: ['$my_submissions.status', 0] },
                    submission_score: { $arrayElemAt: ['$my_submissions.score', 0] },
                    host_username: { $arrayElemAt: ['$host_info.username', 0] }
                }
            },
            {
                $sort: { latest_submission: -1 }
            },
            {
                $project: {
                    _id: 0,
                    host_info: 0
                }
            }
        ]).toArray();

        return { 
            message: { 
                success: true, 
                data: campaignsAggregation,
                total_campaigns: campaignsAggregation.length,
                total_submissions: submissions.length
            }, 
            status: 200 
        };

    } catch (error) {
        console.error("Error retrieving campaigns with submissions:", error);
        return { 
            message: { 
                success: false, 
                message: "Error retrieving campaigns with submissions" 
            }, 
            status: 500 
        };
    } finally {
        await client.close();
    }
};

export default getCampaignsWithSubmissions;
