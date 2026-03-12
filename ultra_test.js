const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
    const s = createClient(process.env.SUPABASE_URL.trim(), process.env.SUPABASE_KEY.trim());
    
    console.log('--- TEST 1: Head count ---');
    const r1 = await s.from('students').select('*', { head: true, count: 'exact' });
    console.log('R1:', JSON.stringify(r1));

    console.log('\n--- TEST 2: Normal select ---');
    const r2 = await s.from('students').select('*').limit(1);
    console.log('R2:', JSON.stringify(r2));
    
    console.log('\n--- TEST 3: Select ID only ---');
    const r3 = await s.from('students').select('id').limit(1);
    console.log('R3:', JSON.stringify(r3));
}

run();
