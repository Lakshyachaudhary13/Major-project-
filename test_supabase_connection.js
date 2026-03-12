const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('--- Deep Diagnostic ---');
    const { data, error } = await supabase.from('students').select('*').limit(1);
    
    if (error) {
        console.log('Error found:');
        console.log(JSON.stringify(error, null, 2));
        
        if (error.code === 'PGRST204' || error.code === 'PGRST205') {
            console.log('\nPotential Cause: Tables are definitely missing or schema cache needs reload.');
        }
    } else {
        console.log('✅ Success! Data:', data);
    }
}

checkTables();
