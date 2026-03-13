const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkCounts() {
    const supabase = createClient(process.env.SUPABASE_URL.trim(), process.env.SUPABASE_KEY.trim());
    
    const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
    const { count: teacherCount } = await supabase.from('teachers').select('*', { count: 'exact', head: true });
    
    console.log('Total Students:', studentCount);
    console.log('Total Teachers:', teacherCount);
}

checkCounts();
