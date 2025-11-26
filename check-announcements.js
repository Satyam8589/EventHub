// Quick test to check if announcements column exists
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function quickCheck() {
  console.log('🔍 Quick Announcements Check\n');
  
  // Try to fetch announcements column
  const { data, error } = await supabase
    .from('events')
    .select('id, title, announcements')
    .limit(1);

  if (error) {
    console.log('❌ ERROR:', error.message);
    if (error.message.includes('announcements')) {
      console.log('\n⚠️  The "announcements" column does NOT exist yet!');
      console.log('\n📋 YOU MUST:');
      console.log('1. Open Supabase Dashboard → SQL Editor');
      console.log('2. Run the SQL from: add_event_announcements.sql');
      console.log('3. Then restart your dev server\n');
    }
  } else {
    console.log('✅ Announcements column EXISTS!');
    console.log('✅ Database is ready\n');
    console.log('Now just restart your dev server:\n');
    console.log('   1. Press Ctrl+C in your terminal');
    console.log('   2. Run: npm run dev');
    console.log('   3. Or double-click: restart-server.bat\n');
  }
}

quickCheck().catch(console.error);
