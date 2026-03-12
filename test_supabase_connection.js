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
        console.error(error);
        
        if (error.code === 'PGRST205') {
            console.log('\nPotential Cause: Table "students" not found in the "public" schema.');
        }
    } else {
        console.log('✅ Success! Data:', data);
    }
    
    console.log('\nChecking "complaints" table...');
    const result = await supabase.from('complaints').select('*').limit(1);
    if (result.error) {
        console.error('Complaints Error:', result.error.message);
    } else {
        console.log('✅ Complaints table is accessible!');
    }
}

checkTables();
