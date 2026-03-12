const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function mysteryTest() {
    const s = createClient(process.env.SUPABASE_URL.trim(), process.env.SUPABASE_KEY.trim());
    
    console.log('--- TEST 1: Head Select ---');
    const r1 = await s.from('students').select('*', { head: true });
    console.log('R1 Error:', r1.error ? r1.error.message : 'None', 'Status:', r1.status);

    console.log('\n--- TEST 2: Normal Select ---');
    const r2 = await s.from('students').select('*');
    console.log('R2 Error:', r2.error ? r2.error.message : 'None', 'Status:', r2.status);

    console.log('\n--- TEST 3: Insert ---');
    const r3 = await s.from('students').insert({ name: 'Test' });
    console.log('R3 Error:', r3.error ? r3.error.message : 'None', 'Status:', r3.status);
}

mysteryTest();
