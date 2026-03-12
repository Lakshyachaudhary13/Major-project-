const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_KEY || '').trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function finalTest() {
    console.log('Testing connection to "students" table...');
    const { data: selectData, error: selectError } = await supabase.from('students').select('id').limit(1);
    
    if (selectError) {
        console.error('❌ Select failed:', selectError.message);
        if (selectError.code === 'PGRST205') {
            console.log('HINT: Table "students" is still not recognized by the API.');
        }
        return;
    }
    console.log('✅ Select successful. Table exists.');

    console.log('Testing insertion...');
    const testId = 'TEST' + Date.now();
    const { data: insertData, error: insertError } = await supabase
        .from('students')
        .insert([{
            name: 'Diagnostic User',
            gmail: `diag_${Date.now()}@gmail.com`,
            studentId: testId,
            password: 'hashed_password_here'
        }])
        .select();

    if (insertError) {
        console.error('❌ Insert failed:', insertError.message);
    } else {
        console.log('✅ Insert successful! Created ID:', insertData[0].id);
        
        // Cleanup
        console.log('Cleaning up test row...');
        await supabase.from('students').delete().eq('studentId', testId);
        console.log('✅ Cleanup done.');
    }
}

finalTest();
