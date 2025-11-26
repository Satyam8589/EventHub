// Test if announcements column exists
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log('Testing announcements column...\n');
  
  const { data, error } = await supabase
    .from('events')
    .select('id, announcements')
    .limit(1);

  if (error) {
    console.log('❌ ERROR:', error.message);
    console.log('\n⚠️  PROBLEM: The announcements column does NOT exist!');
    console.log('\n✅ SOLUTION:');
    console.log('1. Go to: https://supabase.com/dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Run this SQL:\n');
    console.log('ALTER TABLE events ADD COLUMN announcements JSONB DEFAULT \'[]\'::jsonb;');
    console.log('CREATE INDEX idx_events_announcements ON events USING GIN (announcements);\n');
  } else {
    console.log('✅ SUCCESS! Announcements column exists');
    console.log('✅ The route should work now');
    console.log('\nIf still getting 404, try:');
    console.log('1. Stop server (Ctrl+C)');
    console.log('2. Delete .next folder');
    console.log('3. Run: npm run dev');
  }
}

test();
