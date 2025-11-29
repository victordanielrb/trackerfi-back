/**
 * Check Alerts Script
 * 
 * This script is run by a GitHub Action every 10 minutes to check all user alerts
 * against current token prices from CoinGecko.
 */

import 'dotenv/config';
import { checkAllAlerts } from '../functions/alerts/checkAlerts';

async function main() {
  try {
    console.log('🚀 Starting alerts check process...');
    console.log(`📅 Time: ${new Date().toISOString()}`);
    
    const result = await checkAllAlerts();
    
    console.log('\n✅ Alerts check process completed');
    console.log(`   Users checked: ${result.usersChecked}`);
    console.log(`   Alerts checked: ${result.alertsChecked}`);
    console.log(`   Alerts triggered: ${result.alertsTriggered}`);
    
    if (result.triggeredAlerts.length > 0) {
      console.log('\n📢 Triggered Alerts:');
      for (const triggered of result.triggeredAlerts) {
        console.log(`   - User ${triggered.user_id}: ${triggered.alert.token_symbol} ${triggered.alert.alert_type} ${triggered.alert.price_threshold} (current: $${triggered.current_price})`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Alerts check process failed:', error);
    process.exit(1);
  }
}

main();
