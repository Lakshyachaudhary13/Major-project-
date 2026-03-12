const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
    const s = createClient(process.env.SUPABASE_URL.trim(), process.env.SUPABASE_KEY.trim());
    
    const tables = ['students', 'teachers', 'complaints', 'admins'];
    for (const table of tables) {
        console.log(`Checking Table: ${table}...`);
        const { error, status } = await s.from(table).select('*', { head: true });
        if (error) {
            console.log(`❌ ${table} failed: ${error.message} (${error.code})`);
        } else {
            console.log(`✅ ${table} is UP! (Status: ${status})`);
        }
    }
}

run();
