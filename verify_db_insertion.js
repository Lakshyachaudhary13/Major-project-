const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const bcrypt = require('bcryptjs');

async function verifyRegistrationLogic() {
    const supabase = createClient(process.env.SUPABASE_URL.trim(), process.env.SUPABASE_KEY.trim());
    const timestamp = Date.now();

    console.log('--- Verifying Student Insert ---');
    const studentData = {
        name: 'Verify Student',
        email: `verify_stu_${timestamp}@gmail.com`,
        gmail: `verify_stu_${timestamp}@gmail.com`,
        studentId: `V_STU_${timestamp}`,
        phone: '9999999999',
        password: await bcrypt.hash('temp123', 10),
        createdAt: new Date().toISOString()
    };

    const { data: stuResult, error: stuError } = await supabase
        .from('students')
        .insert([studentData])
        .select();

    if (stuError) {
        console.error('❌ Student Insert Failed:', stuError.message);
    } else {
        console.log('✅ Student Insert Successful:', stuResult[0].studentId);
    }

    console.log('\n--- Verifying Teacher Insert ---');
    const teacherData = {
        name: 'Verify Teacher',
        gmail: `verify_tea_${timestamp}@gmail.com`,
        teacherId: `V_TEA_${timestamp}`,
        department: 'Testing',
        password: await bcrypt.hash('password123', 10),
        createdAt: new Date().toISOString()
    };

    const { data: teaResult, error: teaError } = await supabase
        .from('teachers')
        .insert([teacherData])
        .select();

    if (teaError) {
        console.error('❌ Teacher Insert Failed:', teaError.message);
    } else {
        console.log('✅ Teacher Insert Successful:', teaResult[0].teacherId);
    }
}

verifyRegistrationLogic();
