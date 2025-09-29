import { CampaignParticipant } from './campaignParticipant';
import { Blockchain } from './general';
import { RewardCurrency } from './user';

export enum CampaignContentType {
  VIDEO = 'VIDEO',
  ARTICLE = 'ARTICLE',
  SOCIAL_POST = 'SOCIAL_POST',
  MEME = 'MEME',
  OTHER = 'OTHER',
}

export enum CampaignContentFormat {
  SHORT_VIDEO = 'SHORT_VIDEO',
  LONG_VIDEO = 'LONG_VIDEO',
  TWITTER_THREAD = 'TWITTER_THREAD',
  BLOG_POST = 'BLOG_POST',
}

export enum CampaignStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export interface RewardTier {
  tier: number;
  percentage: number;
  description: string;
  positions: string; // e.g., "1st", "2nd", "3rd", "4th-6th"
}

export interface Campaign {
  id: string;
  host_id: string; // HOST creates campaigns
  title: string;
  description: string;
  requirements: string;
  evaluation_criteria: string;
  rules: any[];
  official_links: string[];
  support_contact: string;
  target_blockchain: Blockchain;
  total_prize_pool: number;
  max_participants?: number;
  winner_count: number;
  reward: {
    amount: number;
    currency: RewardCurrency;
  };
  reward_tiers: RewardTier[]; // New reward tiers system
  status: CampaignStatus;
  participants: CampaignParticipant[];
  rejection_reason?: string;
  start_date: string; // Campaign start date
  end_date: string; // Campaign end date
  deadline: string; // Submission deadline
  created_at: string;
  approved_at?: string;
  completed_at?: string;
  approved_by?: string;
  payment_received: boolean;
  rewards_distributed: boolean;
}
