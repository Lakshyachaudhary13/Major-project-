const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_KEY || '').trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function retryTest() {
    for (let i = 1; i <= 5; i++) {
        console.log(`Attempt ${i}: Checking "students" table...`);
        const { error } = await supabase.from('students').select('*').limit(0);
        if (!error) {
            console.log('✅ SUCCESS! The table is now visible.');
            return;
        }
        console.log(`❌ Failed: ${error.message} (Code: ${error.code})`);
        if (i < 5) {
            console.log('Waiting 5 seconds before retry...');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    console.log('\nFinal Result: Still not working. Please double-check you ran the script in project: xyytbmvsuztjwyfqsnnm');
}

retryTest();
