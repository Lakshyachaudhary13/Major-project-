const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testInsert() {
    const s = createClient(process.env.SUPABASE_URL.trim(), process.env.SUPABASE_KEY.trim());
    
    console.log('Attempting insert into students...');
    const { data, error } = await s.from('students').insert({
        name: 'Test Setup',
        gmail: 'test@gmail.com',
        studentId: 'TEST12345',
        password: 'pass'
    }).select();

    if (error) {
        console.error('❌ Insert Error:', error.message);
        console.error('Full Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('✅ Insert Successful! Data:', JSON.stringify(data));
        
        console.log('Cleaning up...');
        await s.from('students').delete().eq('studentId', 'TEST12345');
        console.log('✅ Cleanup successful.');
    }
}

testInsert();
