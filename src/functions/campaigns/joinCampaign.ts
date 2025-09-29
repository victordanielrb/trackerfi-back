import { Request } from 'express';
import mongo from '../../mongo';
import { UserType } from '../../interfaces/user';
import { CampaignStatus } from '../../interfaces/campaign';
import { toObjectId } from '../../utils/mongodb';

const joinCampaign = async (req: Request) => {
    const client = mongo();
    try {
        const { id } = req.params;
        const { user_id, wallet_address } = req.body;

        const campaignObjectId = toObjectId(id);
        const userObjectId = toObjectId(user_id);
        
        if (!campaignObjectId || !userObjectId) {
            return { message: "Invalid campaign ID or user ID", status: 400 };
        }
        
        await client.connect();
        const database = client.db("bounties");
        
        // Verify user exists and is a HOST (only hosts can participate in campaigns)
        const user = await database.collection("users").findOne({ 
            _id: userObjectId,
            user_type: UserType.HOST,
            status: 'ACTIVE'
        });
        
        if (!user) {
            return { message: "User not found, inactive, or not eligible to participate", status: 404 };
        }
        
        // Verificar se a campanha existe e está ativa
        const campaign = await database.collection("campaigns").findOne({ 
            _id: campaignObjectId, 
            status: CampaignStatus.ACTIVE,
            deadline: { $gt: new Date() }
        });
        
        if (!campaign) {
            return { message: "Campaign not found or expired", status: 404 };
        }
        
        // Verificar se o usuário tem wallet compatível com target_blockchain
        const userWallet = await database.collection("user_wallets").findOne({
            user_id: user_id,
            blockchain: campaign.target_blockchain,
            wallet_address: wallet_address
        });
        
        if (!userWallet) {
            return { message: "User wallet not compatible with campaign blockchain", status: 400 };
        }
        
        // Verificar se já não está participando
        const existingParticipant = await database.collection("campaign_participants").findOne({
            campaign_id: id,
            user_id: user_id
        });
        
        if (existingParticipant) {
            return { message: "User already participating in this campaign", status: 400 };
        }
        
        // Check max participants limit
        if (campaign.max_participants) {
            const participantCount = await database.collection("campaign_participants").countDocuments({
                campaign_id: id
            });
            
            if (participantCount >= campaign.max_participants) {
                return { message: "Campaign has reached maximum participants", status: 400 };
            }
        }
        
        // Adicionar participante
        const newParticipant = {
            campaign_id: id,
            user_id: user_id,
            wallet_address: wallet_address,
            joined_at: new Date().toISOString(),
            status: 'REGISTERED'
        };
        
        const result = await database.collection("campaign_participants").insertOne(newParticipant);
        
        return { 
            message: { 
                id: result.insertedId.toString(),
                ...newParticipant 
            }, 
            status: 201 
        };
    } catch (error) {
        console.error("Error joining campaign:", error);
        return { message: "Error joining campaign", status: 500 };
    } finally {
        await client.close();
    }
};

export default joinCampaign;
