/**
 * Test Push Notification Script
 * 
 * Usage: npx ts-node src/scripts/testPushNotification.ts [userId]
 * 
 * If no userId is provided, it will send to all users with expoPushToken
 */

import 'dotenv/config';
import { withMongoDB } from '../mongo';
import { ObjectId } from 'mongodb';
import axios from 'axios';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  channelId?: string;
}

async function sendTestNotification(expoPushToken: string, userId: string): Promise<boolean> {
  const pushMessage: ExpoPushMessage = {
    to: expoPushToken,
    title: '🧪 Teste de Notificação',
    body: `TrackerFi está funcionando! Você receberá alertas de preço aqui.`,
    data: {
      type: 'test',
      timestamp: new Date().toISOString()
    },
    sound: 'default',
    channelId: 'price-alerts'
  };

  try {
    const response = await axios.post(
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
    
    console.log(`✅ Notification sent to user ${userId}`);
    console.log('   Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send notification to user ${userId}:`, error.message);
    return false;
  }
}

async function main() {
  const targetUserId = process.argv[2]; // Optional: specific user ID
  
  console.log('🔔 Test Push Notification Script');
  console.log('================================');
  console.log(`📅 Time: ${new Date().toISOString()}`);
  
  if (targetUserId) {
    console.log(`🎯 Target user: ${targetUserId}`);
  } else {
    console.log('🎯 Target: All users with push tokens');
  }
  console.log('');

  let sent = 0;
  let failed = 0;
  let noToken = 0;

  await withMongoDB(async (client) => {
    const db = client.db('trackerfi');
    
    // Build query
    const query: any = { expoPushToken: { $exists: true, $ne: null } };
    if (targetUserId) {
      try {
        query._id = new ObjectId(targetUserId);
      } catch (e) {
        console.error('❌ Invalid user ID format');
        return;
      }
    }
    
    const users = await db.collection('users').find(query).toArray();
    
    console.log(`Found ${users.length} user(s) with push tokens\n`);
    
    if (users.length === 0) {
      console.log('⚠️ No users found with expoPushToken');
      console.log('');
      console.log('To register a push token, the user needs to:');
      console.log('1. Install the app on a physical device');
      console.log('2. Grant notification permissions');
      console.log('3. Login to the app');
      return;
    }
    
    for (const user of users) {
      console.log(`📤 Sending to: ${user.email || user.name || user._id}`);
      console.log(`   Token: ${user.expoPushToken.substring(0, 30)}...`);
      
      const success = await sendTestNotification(user.expoPushToken, user._id.toString());
      
      if (success) {
        sent++;
      } else {
        failed++;
      }
      console.log('');
    }
  });

  console.log('================================');
  console.log('📊 Summary:');
  console.log(`   ✅ Sent: ${sent}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log('================================');
}

main()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
