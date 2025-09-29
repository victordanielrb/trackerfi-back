import { RewardTier } from '../interfaces/campaign';

/**
 * Default reward tier templates
 */
export const DEFAULT_REWARD_TIERS: RewardTier[] = [
  {
    tier: 1,
    percentage: 50,
    description: "First Place Winner",
    positions: "1st"
  },
  {
    tier: 2,
    percentage: 30,
    description: "Second Place Winner",
    positions: "2nd"
  },
  {
    tier: 3,
    percentage: 20,
    description: "Third Place Winner",
    positions: "3rd"
  }
];

export const EXTENDED_REWARD_TIERS: RewardTier[] = [
  {
    tier: 1,
    percentage: 40,
    description: "First Place Winner",
    positions: "1st"
  },
  {
    tier: 2,
    percentage: 25,
    description: "Second Place Winner",
    positions: "2nd"
  },
  {
    tier: 3,
    percentage: 15,
    description: "Third Place Winner",
    positions: "3rd"
  },
  {
    tier: 4,
    percentage: 20,
    description: "Runners Up",
    positions: "4th-6th"
  }
];

export const PARTICIPATION_REWARD_TIERS: RewardTier[] = [
  {
    tier: 1,
    percentage: 35,
    description: "First Place Winner",
    positions: "1st"
  },
  {
    tier: 2,
    percentage: 20,
    description: "Second Place Winner",
    positions: "2nd"
  },
  {
    tier: 3,
    percentage: 15,
    description: "Third Place Winner",
    positions: "3rd"
  },
  {
    tier: 4,
    percentage: 15,
    description: "Runners Up",
    positions: "4th-6th"
  },
  {
    tier: 5,
    percentage: 15,
    description: "Participation Rewards",
    positions: "7th-20th"
  }
];

/**
 * Validate reward tiers to ensure they sum to 100%
 * @param tiers - Array of reward tiers
 * @returns boolean indicating if tiers are valid
 */
export const validateRewardTiers = (tiers: RewardTier[]): boolean => {
  const totalPercentage = tiers.reduce((sum, tier) => sum + tier.percentage, 0);
  return totalPercentage === 100;
};

/**
 * Calculate reward amounts based on tiers and total prize pool
 * @param tiers - Array of reward tiers
 * @param totalPrizePool - Total prize pool amount
 * @returns Array of tiers with calculated amounts
 */
export const calculateRewardAmounts = (
  tiers: RewardTier[], 
  totalPrizePool: number
): (RewardTier & { amount: number })[] => {
  return tiers.map(tier => ({
    ...tier,
    amount: (totalPrizePool * tier.percentage) / 100
  }));
};

/**
 * Get reward tier templates
 * @param tierType - Type of tier template to get
 * @returns Array of reward tiers
 */
export const getRewardTierTemplate = (tierType: 'default' | 'extended' | 'participation'): RewardTier[] => {
  switch (tierType) {
    case 'extended':
      return EXTENDED_REWARD_TIERS;
    case 'participation':
      return PARTICIPATION_REWARD_TIERS;
    default:
      return DEFAULT_REWARD_TIERS;
  }
};

/**
 * Create custom reward tiers
 * @param customTiers - Array of custom tier configurations
 * @returns Array of validated reward tiers
 */
export const createCustomRewardTiers = (customTiers: Partial<RewardTier>[]): RewardTier[] => {
  return customTiers.map((tier, index) => ({
    tier: tier.tier || index + 1,
    percentage: tier.percentage || 0,
    description: tier.description || `Tier ${index + 1}`,
    positions: tier.positions || `${index + 1}th`
  }));
};
