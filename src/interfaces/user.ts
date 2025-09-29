// User related interfaces
import { Blockchain } from './general';

export enum UserType {
  CREATOR = 'CREATOR', // Twitter users who create campaigns
  HOST = 'HOST',       // Current type of users
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

// Base user interface with common properties
export interface BaseUser {
  id: string;
  username: string;
  user_type: UserType;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

// Host user - create campaigns and manage them
export interface HostUser extends BaseUser {
  user_type: UserType.HOST;
  email: string; // Required for account management and notifications
  password_hash: string; // Required for authentication
  temp_password?: string; // Optional for password reset functionality
  email_verified: boolean;
  discord_id?: string;
  google_id?: string;
  campaigns_created: number;
}

export interface CreatorUser extends BaseUser {
  user_type: UserType.CREATOR;
  twitter_id: string;
  twitter_username: string;
  twitter_display_name?: string;
  twitter_profile_image?: string;
  twitter_verified?: boolean;
  twitter_followers_count?: number;
  twitter_access_token?: string;
  twitter_refresh_token?: string;
  wallet_address?: {
    sui?: string;
    evm?: string;
    solana?: string;
  };
  total_earnings: number;
}

// Admin user
export interface AdminUser extends BaseUser {
  user_type: UserType.ADMIN;
  email: string;
  password_hash: string;
  permissions: string[];
}

// Union type for all user types
export type User = HostUser | CreatorUser | AdminUser;

export enum RewardCurrency {
  USDC = 'USDC',
  SOL = 'SOL',
  SUI = 'SUI',
  ETH = 'ETH',
}

export interface UserWallet {
  id: string;
  user_id: string;
  blockchain: Blockchain;
  wallet_address: string;
  connected_at: string;
}

export { Blockchain };
