const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
    const s = createClient(process.env.SUPABASE_URL.trim(), process.env.SUPABASE_KEY.trim());
    
    console.log('Testing Students Table...');
    const r1 = await s.from('students').select('*', { count: 'exact', head: true });
    
    console.log('Error:', JSON.stringify(r1.error, null, 2));
    console.log('Status:', r1.status);
    console.log('StatusText:', r1.statusText);
}

run();
