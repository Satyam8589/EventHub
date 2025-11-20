// Script to generate VAPID keys for push notifications
// Run this once: node generate-vapid-keys.js

const webpush = require('web-push');

console.log('\n🔑 Generating VAPID Keys for Push Notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID Keys Generated Successfully!\n');
console.log('Add these to your .env.local file:\n');
console.log('─'.repeat(80));
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_EMAIL=mailto:join.eventhub@gmail.com`);
console.log('─'.repeat(80));
console.log('\n📝 Copy the above lines to your .env.local file\n');
console.log('⚠️  IMPORTANT: Keep the private key secret! Never commit it to git.\n');
