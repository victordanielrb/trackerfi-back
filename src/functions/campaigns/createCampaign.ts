import { Request } from 'express';
import mongo from "../../mongo";
import { Campaign, CampaignStatus, RewardTier } from '../../interfaces/campaign';
import { RewardCurrency, UserType } from '../../interfaces/user';
import { DEFAULT_REWARD_TIERS, validateRewardTiers } from '../../utils/rewardTiers';

const createCampaign = async (req: Request) => {
    const client = mongo();
    try {
        await client.connect();
        const database = client.db("bounties");
        
        // Verify that the host exists and is a HOST type user
        const host = await database.collection("users").findOne({ 
            _id: req.body.host_id,
            user_type: UserType.HOST
        });
        
        if (!host) {
            return { message: "Host not found or invalid user type", status: 404 };
        }

        // Handle reward tiers - use provided ones or default
        let rewardTiers: RewardTier[] = req.body.reward_tiers || DEFAULT_REWARD_TIERS;
        
        // Validate reward tiers
        const tierValidation = validateRewardTiers(rewardTiers);
        if (!tierValidation) {
            return { message: 'Reward tiers must sum to 100%', status: 400 };
        }

        const newCampaign: Omit<Campaign, 'id'> = {
            host_id: req.body.host_id,
            title: req.body.title,
            description: req.body.description,
            requirements: req.body.requirements,
            evaluation_criteria: req.body.evaluation_criteria || '',
            rules: req.body.rules || [],
            official_links: req.body.official_links || [],
            support_contact: req.body.support_contact || '',
            target_blockchain: req.body.target_blockchain,
            total_prize_pool: req.body.total_prize_pool,
            max_participants: req.body.max_participants,
            winner_count: req.body.winner_count,
            reward: {
                amount: req.body.total_prize_pool,
                currency: req.body.reward_currency || RewardCurrency.USDC
            },
            reward_tiers: rewardTiers,
            status: CampaignStatus.PENDING, // All new campaigns start as PENDING
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            deadline: req.body.deadline,
            created_at: new Date().toISOString(),
            payment_received: false,
            rewards_distributed: false,
            participants: []
        };

        const result = await database.collection("campaigns").insertOne(newCampaign);
        
        // Update host's campaign count
        await database.collection("users").updateOne(
            { _id: req.body.host_id },
            { 
                $inc: { 
                    campaigns_created: 1
                },
                $set: { updated_at: new Date().toISOString() }
            }
        );

        return { 
            message: {
                success: true,
                data: {
                    ...newCampaign,
                    id: result.insertedId.toString()
                }
            }, 
            status: 201 
        };
    } catch (error) {
        console.error("Error creating campaign:", error);
        return { message: { success: false, message: "Error creating campaign" }, status: 500 };
    } finally {
        await client.close();
    }
};

export default createCampaign;