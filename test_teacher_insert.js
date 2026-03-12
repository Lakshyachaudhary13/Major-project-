const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testInsertTeacher() {
    const s = createClient(process.env.SUPABASE_URL.trim(), process.env.SUPABASE_KEY.trim());
    
    console.log('Attempting insert into teachers...');
    const { error } = await s.from('teachers').insert({
        name: 'Test Teacher',
        gmail: 'teacher@gmail.com',
        teacherId: 'T123',
        password: 'pass'
    });

    if (error) {
        console.error('❌ Teacher Insert Error:', error.message);
    } else {
        console.log('✅ Teacher Insert Successful!');
        await s.from('teachers').delete().eq('teacherId', 'T123');
    }
}

testInsertTeacher();
