import axios from 'axios';
import { withMongoDB } from '../../mongo';

interface Transaction {
  id: string;
  type: string;
  protocol?: string;
  mined_at: string;
  hash: string;
  status: string;
  direction?: string;
  address_from?: string;
  address_to?: string;
  fee?: {
    value: number;
    price: number;
    fungible_info: {
      name: string;
      symbol: string;
      icon?: {
        url: string;
      };
    };
  };
  transfers?: Array<{
    fungible_info?: {
      name: string;
      symbol: string;
      icon?: {
        url: string;
      };
    };
    direction: string;
    quantity: {
      float: number;
      numeric: string;
    };
    value?: number;
    price?: number;
    nft_info?: any;
  }>;
  applications?: Array<{
    name: string;
    icon?: {
      url: string;
    };
  }>;
}

interface WalletTransactionsResponse {
  data: Transaction[];
  links?: {
    next?: string;
  };
}

interface CachedTransactions {
  wallet_address: string;
  chain: string;
  transactions: Transaction[];
  last_updated: Date;
  next_cursor?: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const ZERION_API_KEY = process.env.ZERION_API_KEY;

if (!ZERION_API_KEY) {
  console.warn('ZERION_API_KEY not found in environment variables');
}

export default async function getWalletTransactions(
  walletAddress: string, 
  chain?: string,
  cursor?: string
): Promise<{ transactions: Transaction[], nextCursor?: string }> {
  try {
    const cacheKey = `${walletAddress}_${chain || 'all'}`;
    
    // Check if we have fresh cached data (only if no cursor is provided - for pagination)
    if (!cursor) {
      const cached = await getTransactionsFromCache(walletAddress, chain || 'all');
      
      if (cached && (Date.now() - cached.last_updated.getTime()) < CACHE_DURATION) {
        console.log(`Using cached wallet transactions for ${walletAddress} (${chain || 'all chains'})`);
        return { 
          transactions: cached.transactions, 
          nextCursor: cached.next_cursor 
        };
      }
    }

    // Fetch from Zerion API
    console.log(`Fetching wallet transactions from Zerion for ${walletAddress} (${chain || 'all chains'})`);
    
    const headers: any = {
      'Authorization': `Basic ${Buffer.from(ZERION_API_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/json'
    };

    let url = `https://api.zerion.io/v1/wallets/${walletAddress}/transactions/`;
    const params: string[] = [];
    
    if (chain) {
      params.push(`filter[chain_ids]=${chain}`);
    }
    if (cursor) {
      params.push(`page[after]=${cursor}`);
    }
    params.push('page[size]=50'); // Limit to 50 transactions per request
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    const response = await axios.get<WalletTransactionsResponse>(url, { headers });
    
    if (!response.data || !Array.isArray(response.data.data)) {
      throw new Error('Invalid response format from Zerion API');
    }

    const transactions = response.data.data;
    const nextCursor = response.data.links?.next ? 
      new URL(response.data.links.next).searchParams.get('page[after]') : undefined;

    // Cache only the first page (when no cursor was provided)
    if (!cursor) {
      try {
        await saveTransactionsToCache(walletAddress, chain || 'all', transactions, nextCursor);
        console.log(`Cached wallet transactions for ${walletAddress} (${chain || 'all chains'})`);
      } catch (cacheError) {
        console.warn('Failed to cache wallet transactions:', cacheError);
      }
    }

    return { transactions, nextCursor };

  } catch (error: any) {
    console.error('Error fetching wallet transactions:', error);
    
    // Try to return cached data if API fails
    if (!cursor) {
      try {
        const cached = await getTransactionsFromCache(walletAddress, chain || 'all');
        
        if (cached) {
          console.log(`API failed, returning stale cached transactions for ${walletAddress}`);
          return { 
            transactions: cached.transactions, 
            nextCursor: cached.next_cursor 
          };
        }
      } catch (cacheError) {
        console.warn('Failed to retrieve cached transactions:', cacheError);
      }
    }

    throw new Error(`Failed to fetch wallet transactions: ${error.message}`);
  }
}

/**
 * Get transactions from cache
 */
async function getTransactionsFromCache(walletAddress: string, chain: string): Promise<CachedTransactions | null> {
  try {
    return await withMongoDB(async client => {
      const db = client.db('trackerfi');
      const collection = db.collection('transactions');
      
      const result = await collection.findOne({ 
        wallet_address: walletAddress,
        chain: chain
      });
      
      return result as unknown as CachedTransactions | null;
    });
  } catch (error) {
    console.error('Error fetching transactions from cache:', error);
    return null;
  }
}

/**
 * Save transactions to cache
 */
async function saveTransactionsToCache(
  walletAddress: string, 
  chain: string, 
  transactions: Transaction[], 
  nextCursor?: string
): Promise<void> {
  try {
    await withMongoDB(async client => {
      const db = client.db('trackerfi');
      const collection = db.collection('wallet_transactions_cache');
      
      await collection.replaceOne(
        { 
          wallet_address: walletAddress,
          chain: chain
        },
        {
          wallet_address: walletAddress,
          chain: chain,
          transactions,
          next_cursor: nextCursor,
          last_updated: new Date()
        },
        { upsert: true }
      );
    });
  } catch (error) {
    console.error('Error saving transactions to cache:', error);
    // Don't throw - caching failure shouldn't break the request
  }
}