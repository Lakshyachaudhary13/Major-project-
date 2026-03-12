const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL.trim(), process.env.SUPABASE_KEY.trim());

async function verify() {
    console.log('--- Testing STUDENT Registration ---');
    const studentData = {
        name: 'Verify Student',
        gmail: `vstudent_${Date.now()}@gmail.com`,
        studentId: `VS_${Date.now()}`,
        password: 'pass'
    };
    const { data: sData, error: sErr } = await supabase.from('students').insert([studentData]).select();
    if (sErr) {
        console.error('❌ Student Reg Failed:', sErr.message);
    } else {
        console.log('✅ Student Reg Successful:', sData[0].studentId);
        await supabase.from('students').delete().eq('studentId', studentData.studentId);
    }

    console.log('\n--- Testing TEACHER Registration ---');
    const teacherData = {
        name: 'Verify Teacher',
        gmail: `vteacher_${Date.now()}@gmail.com`,
        teacherId: `VT_${Date.now()}`,
        password: 'pass'
    };
    const { data: tData, error: tErr } = await supabase.from('teachers').insert([teacherData]).select();
    if (tErr) {
        console.error('❌ Teacher Reg Failed:', tErr.message);
    } else {
        console.log('✅ Teacher Reg Successful:', tData[0].teacherId);
        await supabase.from('teachers').delete().eq('teacherId', teacherData.teacherId);
    }
}

verify();
