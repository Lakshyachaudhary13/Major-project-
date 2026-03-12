const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function compare() {
    const s = createClient(process.env.SUPABASE_URL.trim(), process.env.SUPABASE_KEY.trim());
    
    console.log('--- Real Table (students) ---');
    const r1 = await s.from('students').select('*', { head: true });
    console.log('Error:', r1.error ? r1.error.message : 'None', 'Status:', r1.status);

    console.log('\n--- Fake Table (xyz_123) ---');
    const r2 = await s.from('xyz_123').select('*', { head: true });
    console.log('Error:', r2.error ? r2.error.message : 'None', 'Status:', r2.status);
}

compare();
