import { getDb } from '../../mongo';
import { ObjectId } from 'mongodb';
import axios from 'axios';
import { Alert } from '../../interfaces/userInterface';

// CoinGecko API configuration
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const coingeckoHeaders = COINGECKO_API_KEY ? { 'x-cg-demo-api-key': COINGECKO_API_KEY } : {};

// Expo Push Notification types
interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
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

  const db = await getDb();

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

        // Disable the alert and update trigger info
        await db.collection('users').updateOne(
          { _id: user._id },
          {
            $set: {
              [`alerts.${i}.is_active`]: false, // Disable alert after triggering
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

        // Send Expo Push Notification if user has a push token
        if (user.expoPushToken) {
          const direction = alert.alert_type === 'price_above' ? 'subiu acima de' : 'caiu abaixo de';
          const pushMessage: ExpoPushMessage = {
            to: user.expoPushToken,
            title: `🚨 Alerta: ${alert.token_symbol}`,
            body: `${alert.token_name} ${direction} $${threshold.toFixed(2)}! Preço atual: $${currentPrice.toFixed(2)}`,
            data: {
              type: 'alert_triggered',
              token_id: alert.token_id,
              token_symbol: alert.token_symbol,
              current_price: currentPrice,
              threshold_price: threshold
            },
            sound: 'default',
            channelId: 'price-alerts'
          };

          try {
            const pushResponse = await axios.post(
              'https://exp.host/--/api/v2/push/send',
              pushMessage,
              {
                headers: {
                  'Accept': 'application/json',
                  'Accept-Encoding': 'gzip, deflate',
                  'Content-Type': 'application/json',
                },
                timeout: 10000
              }
            );
            console.log(`  📲 Push notification sent to user ${user._id}:`, pushResponse.data);
          } catch (pushError: any) {
            console.error(`  ❌ Failed to send push notification:`, pushError.message);
          }
        } else {
          console.log(`  ⚠️ User ${user._id} has no expoPushToken`);
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
