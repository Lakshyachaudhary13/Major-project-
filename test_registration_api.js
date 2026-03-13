const axios = require('axios');

async function testRegistration() {
    const baseUrl = 'http://localhost:3000';
    
    console.log('--- Testing Student Registration ---');
    try {
        const studentData = {
            name: 'Test Student',
            gmail: `teststudent_${Date.now()}@gmail.com`,
            studentId: `STU_${Date.now()}`,
            phone: '1234567890'
        };
        
        const studentRes = await axios.post(`${baseUrl}/api/students/register`, studentData);
        console.log('✅ Student Registration Success:', studentRes.data.message);
    } catch (error) {
        console.error('❌ Student Registration Failed:', error.response ? error.response.data : error.message);
    }

    console.log('\n--- Testing Teacher Registration ---');
    try {
        const teacherData = {
            name: 'Test Teacher',
            gmail: `testteacher_${Date.now()}@gmail.com`,
            teacherId: `TEA_${Date.now()}`,
            department: 'Computer Science',
            password: 'password123'
        };
        
        const teacherRes = await axios.post(`${baseUrl}/api/teachers/register`, teacherData);
        console.log('✅ Teacher Registration Success:', teacherRes.data.message);
    } catch (error) {
        console.error('❌ Teacher Registration Failed:', error.response ? error.response.data : error.message);
    }
}

testRegistration();
