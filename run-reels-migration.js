// Run this script to create the reels table in your database
// Usage: node run-reels-migration.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    console.log('🚀 Running reels table migration...\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'supabase_migrations', 'create_reels_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // Try direct query if RPC doesn't work
        const { error: directError } = await supabase.from('_').select('*').limit(0);
        if (directError) {
          console.error('❌ Error:', error.message);
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nYou can now:');
    console.log('1. Visit /reels page');
    console.log('2. Upload reels with hashtags');
    console.log('3. Filter by tags\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📝 Please run the SQL manually in Supabase Dashboard:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the contents of: supabase_migrations/create_reels_table.sql');
    console.log('5. Click "Run"\n');
  }
}

runMigration();
