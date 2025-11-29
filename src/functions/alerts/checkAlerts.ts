import { withMongoDB } from '../../mongo';
import { ObjectId } from 'mongodb';
import axios from 'axios';
import { Alert } from '../../interfaces/userInterface';
import { notifyUser } from './wsServer';

// CoinGecko API configuration
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const coingeckoHeaders = COINGECKO_API_KEY ? { 'x-cg-demo-api-key': COINGECKO_API_KEY } : {};

// WebSocket event types
export interface AlertTriggeredEvent {
  type: 'alert_triggered';
  data: {
    token_name: string;
    token_symbol: string;
    alert_type: 'price_above' | 'price_below';
    threshold_price: number;
    current_price: number;
    triggered_at: string;
  };
}

interface TriggeredAlert {
  user_id: ObjectId;
  alert: Alert;
  current_price: number;
  triggered_at: string;
}

/**
 * Fetch current price for a token from CoinGecko
 */
async function getTokenPrice(tokenId: string): Promise<number | null> {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(tokenId)}&vs_currencies=usd`;
    const { data } = await axios.get(url, { 
      timeout: 10000, 
      headers: coingeckoHeaders 
    });
    
    if (data && data[tokenId] && typeof data[tokenId].usd === 'number') {
      return data[tokenId].usd;
    }
    return null;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      console.warn(`CoinGecko rate limit hit for token: ${tokenId}`);
    } else {
      console.error(`Failed to get price for ${tokenId}:`, error.message);
    }
    return null;
  }
}

/**
 * Fetch prices for multiple tokens in batch (up to 250 tokens per request)
 */
async function getTokenPricesBatch(tokenIds: string[]): Promise<Record<string, number>> {
  if (tokenIds.length === 0) return {};
  
  try {
    const ids = tokenIds.join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd`;
    const { data } = await axios.get(url, { 
      timeout: 15000, 
      headers: coingeckoHeaders 
    });
    
    const prices: Record<string, number> = {};
    for (const tokenId of tokenIds) {
      if (data && data[tokenId] && typeof data[tokenId].usd === 'number') {
        prices[tokenId] = data[tokenId].usd;
      }
    }
    return prices;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      console.warn('CoinGecko rate limit hit for batch price request');
    } else {
      console.error('Failed to get batch prices:', error.message);
    }
    return {};
  }
}

/**
 * Check all users' alerts against current token prices
 * This is the main function to be called by the GitHub Action
 */
export async function checkAllAlerts(): Promise<{
  usersChecked: number;
  alertsChecked: number;
  alertsTriggered: number;
  triggeredAlerts: TriggeredAlert[];
}> {
  console.log('🔔 Starting alerts check...');
  console.log(`📅 Time: ${new Date().toISOString()}`);
  
  let usersChecked = 0;
  let alertsChecked = 0;
  let alertsTriggered = 0;
  const triggeredAlerts: TriggeredAlert[] = [];
  
  await withMongoDB(async client => {
    const db = client.db('trackerfi');
    
    // Find all users with active alerts
    const users = await db.collection('users').find({
      alerts: { $exists: true, $ne: [] }
    }).toArray();
    
    console.log(`Found ${users.length} users with alerts`);
    
    // Collect all unique token IDs to fetch prices in batch
    const allTokenIds = new Set<string>();
    for (const user of users) {
      if (!user.alerts) continue;
      for (const alert of user.alerts as Alert[]) {
        if (alert.is_active && alert.token_id) {
          allTokenIds.add(alert.token_id);
        }
      }
    }
    
    console.log(`Fetching prices for ${allTokenIds.size} unique tokens...`);
    
    // Fetch all prices in batch
    const tokenPrices = await getTokenPricesBatch(Array.from(allTokenIds));
    console.log(`Got prices for ${Object.keys(tokenPrices).length} tokens`);
    
    const nowIso = new Date().toISOString();
    
    // Check each user's alerts
    for (const user of users) {
      if (!user.alerts || user.alerts.length === 0) continue;
      
      usersChecked++;
      const alerts = user.alerts as Alert[];
      
      for (let i = 0; i < alerts.length; i++) {
        const alert = alerts[i];
        if (!alert.is_active || !alert.token_id) continue;
        
        alertsChecked++;
        
        const currentPrice = tokenPrices[alert.token_id];
        if (currentPrice === undefined) {
          console.warn(`  ⚠️ No price for ${alert.token_symbol} (${alert.token_id})`);
          continue;
        }
        
        const threshold = Number(alert.price_threshold);
        let triggered = false;
        
        if (alert.alert_type === 'price_above' && currentPrice > threshold) {
          triggered = true;
        }
        if (alert.alert_type === 'price_below' && currentPrice < threshold) {
          triggered = true;
        }
        
        if (triggered) {
          alertsTriggered++;
          console.log(`  🚨 TRIGGERED: ${alert.token_symbol} ${alert.alert_type} ${threshold} (current: ${currentPrice})`);
          
          // Update the alert
          await db.collection('users').updateOne(
            { _id: user._id },
            {
              $set: {
                [`alerts.${i}.last_triggered`]: nowIso,
                [`alerts.${i}.updated_at`]: nowIso
              },
              $inc: {
                [`alerts.${i}.triggered_count`]: 1
              }
            }
          );
          
          // Store in alerts history
          await db.collection('alerts_history').insertOne({
            user_id: user._id,
            alert: alert,
            current_price: currentPrice,
            triggered_at: nowIso
          });
          
          // Send WebSocket notification to user
          const wsEvent: AlertTriggeredEvent = {
            type: 'alert_triggered',
            data: {
              token_name: alert.token_name,
              token_symbol: alert.token_symbol,
              alert_type: alert.alert_type,
              threshold_price: threshold,
              current_price: currentPrice,
              triggered_at: nowIso
            }
          };
          
          const userId = user._id.toString();
          const notified = notifyUser(userId, wsEvent);
          if (notified) {
            console.log(`  📤 WebSocket notification sent to user ${userId}`);
          }
          
          triggeredAlerts.push({
            user_id: user._id,
            alert,
            current_price: currentPrice,
            triggered_at: nowIso
          });
        }
      }
    }
  });
  
  console.log('\n========== ALERTS CHECK SUMMARY ==========');
  console.log(`Users checked: ${usersChecked}`);
  console.log(`Alerts checked: ${alertsChecked}`);
  console.log(`Alerts triggered: ${alertsTriggered}`);
  console.log('==========================================');
  
  return {
    usersChecked,
    alertsChecked,
    alertsTriggered,
    triggeredAlerts
  };
}

/**
 * Legacy function for backward compatibility with websocket polling
 */
export function startAlertsPolling(intervalMs = 3 * 60 * 1000) {
  checkAllAlerts().catch(e => console.error('Initial alerts check failed:', e));
  setInterval(() => {
    checkAllAlerts().catch(e => console.error('Scheduled alerts check failed:', e));
  }, intervalMs);
}

export default { checkAllAlerts, startAlertsPolling, getTokenPrice, getTokenPricesBatch };
