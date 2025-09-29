import { Request } from 'express';
import mongo from '../../mongo';
import { Campaign, CampaignStatus } from '../../interfaces/campaign';
import { toObjectId } from '../../utils/mongodb';

interface CampaignFilters {
  status?: CampaignStatus;
  host_id?: string;
  participant_id?: string;
  blockchain?: string;
  min_prize_pool?: number;
  max_prize_pool?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
  max_participants?: number;
  is_active?: boolean;
}

interface CampaignResponse {
  status: number;
  message: any;
}

const getCampaignsWithFilters = async (req: Request): Promise<CampaignResponse> => {
  const client = mongo();
  
  try {
    await client.connect();
    const database = client.db("bounties");
    const campaignsCollection = database.collection("campaigns");

    // Extract query parameters
    const {
      status,
      host_id,
      participant_id,
      blockchain,
      min_prize_pool,
      max_prize_pool,
      start_date,
      end_date,
      search,
      max_participants,
      is_active,
      page = "1",
      limit = "10",
      sort_by = "created_at",
      sort_order = "desc"
    } = req.query;

    // Build filter object
    const filters: any = {};

    // Status filter
    if (status && Object.values(CampaignStatus).includes(status as CampaignStatus)) {
      filters.status = status;
    }

    // Host filter
    if (host_id) {
      const hostObjectId = toObjectId(host_id as string);
      if (hostObjectId) {
        filters.host_id = hostObjectId;
      }
    }

    // Participant filter
    if (participant_id) {
      const participantObjectId = toObjectId(participant_id as string);
      if (participantObjectId) {
        filters['participants.user_id'] = participantObjectId;
      }
    }

    // Blockchain filter
    if (blockchain) {
      filters.target_blockchain = blockchain;
    }

    // Prize pool range filter
    if (min_prize_pool || max_prize_pool) {
      filters.total_prize_pool = {};
      if (min_prize_pool) {
        filters.total_prize_pool.$gte = parseFloat(min_prize_pool as string);
      }
      if (max_prize_pool) {
        filters.total_prize_pool.$lte = parseFloat(max_prize_pool as string);
      }
    }

    // Date range filter
    if (start_date || end_date) {
      filters.start_date = {};
      if (start_date) {
        filters.start_date.$gte = new Date(start_date as string).toISOString();
      }
      if (end_date) {
        filters.start_date.$lte = new Date(end_date as string).toISOString();
      }
    }

    // Active campaigns filter (campaigns that are currently running)
    if (is_active === 'true') {
      const now = new Date().toISOString();
      filters.status = CampaignStatus.ACTIVE;
      filters.start_date = { $lte: now };
      filters.end_date = { $gte: now };
    }

    // Search filter (title, description, requirements)
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { requirements: { $regex: search, $options: 'i' } }
      ];
    }

    // Max participants filter
    if (max_participants) {
      filters.max_participants = { $lte: parseInt(max_participants as string) };
    }

    // Pagination
    const pageNumber = Math.max(1, parseInt(page as string));
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNumber - 1) * limitNumber;

    // Sorting
    const sortOptions: any = {};
    const validSortFields = ['created_at', 'start_date', 'end_date', 'total_prize_pool', 'title'];
    const sortField = validSortFields.includes(sort_by as string) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'asc' ? 1 : -1;
    sortOptions[sortField as string] = sortDirection;

    // Execute query with aggregation pipeline
    const pipeline = [
      { $match: filters },
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
          participant_count: { $size: '$participants' },
          host_username: { $arrayElemAt: ['$host_info.username', 0] }
        }
      },
      { $sort: sortOptions },
      { $skip: skip },
      { $limit: limitNumber },
      {
        $project: {
          _id: 0,
          host_info: 0
        }
      }
    ];

    const campaigns = await campaignsCollection.aggregate(pipeline).toArray();

    // Get total count for pagination
    const totalCampaigns = await campaignsCollection.countDocuments(filters);
    const totalPages = Math.ceil(totalCampaigns / limitNumber);

    return {
      status: 200,
      message: {
        success: true,
        data: campaigns,
        pagination: {
          current_page: pageNumber,
          total_pages: totalPages,
          total_campaigns: totalCampaigns,
          campaigns_per_page: limitNumber,
          has_next_page: pageNumber < totalPages,
          has_prev_page: pageNumber > 1
        },
        filters_applied: filters
      }
    };

  } catch (error) {
    console.error('Error filtering campaigns:', error);
    return {
      status: 500,
      message: {
        success: false,
        message: 'Failed to filter campaigns',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  } finally {
    await client.close();
  }
};

export default getCampaignsWithFilters;
