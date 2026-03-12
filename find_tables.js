const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function findTables() {
    const s = createClient(process.env.SUPABASE_URL.trim(), process.env.SUPABASE_KEY.trim());
    
    console.log('--- Checking students (All cases) ---');
    const cases = ['students', 'Students', 'STUDENTS', 'public.students'];
    for (const c of cases) {
        const { error, status } = await s.from(c).select('*', { head: true });
        console.log(`[${c}]: Status ${status}, Error: ${error ? error.message : 'None'}`);
    }

    console.log('\n--- Checking Teachers (All cases) ---');
    const tcases = ['teachers', 'Teachers', 'TEACHERS', 'public.teachers'];
    for (const c of tcases) {
        const { error, status } = await s.from(c).select('*', { head: true });
        console.log(`[${c}]: Status ${status}, Error: ${error ? error.message : 'None'}`);
    }
}

findTables();
