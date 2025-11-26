// Test script to check announcements functionality
// Run this with: node test-announcements.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAnnouncements() {
  console.log('🔍 Testing Announcements Feature...\n');

  // 1. Check if announcements column exists
  console.log('1️⃣ Checking if announcements column exists in events table...');
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, announcements')
    .limit(1);

  if (eventsError) {
    console.error('❌ Error:', eventsError.message);
    if (eventsError.message.includes('announcements')) {
      console.log('\n⚠️  ISSUE FOUND: The "announcements" column does not exist!');
      console.log('\n📋 TO FIX:');
      console.log('1. Open Supabase Dashboard → SQL Editor');
      console.log('2. Copy and paste the contents of: add_event_announcements.sql');
      console.log('3. Click "Run" to execute the migration');
      console.log('4. Come back and run this test again\n');
      return;
    }
  } else {
    console.log('✅ Announcements column exists!\n');
  }

  // 2. Test with a sample event and user
  console.log('2️⃣ Enter test details:');
  console.log('   - Event ID: (check your database)');
  console.log('   - User ID: (your Firebase user ID)\n');
  
  // Example test - replace with actual IDs
  const testEventId = 'your-event-id-here';
  const testUserId = 'your-user-id-here';

  console.log('3️⃣ Checking if user has purchased tickets...');
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('eventId', testEventId)
    .eq('userId', testUserId)
    .eq('status', 'CONFIRMED');

  if (bookingError) {
    console.error('❌ Error checking bookings:', bookingError.message);
  } else {
    console.log(`✅ Found ${bookings.length} confirmed booking(s)`);
    if (bookings.length > 0) {
      console.log('   User SHOULD be able to view announcements');
    } else {
      console.log('   User should NOT be able to view announcements');
      console.log('   (No confirmed bookings found)');
    }
  }

  console.log('\n✨ Test complete!');
}

testAnnouncements().catch(console.error);
