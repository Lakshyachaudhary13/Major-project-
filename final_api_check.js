async function finalCheck() {
    const baseUrl = 'http://localhost:3000';
    console.log('--- Final API Check (using fetch) ---');
    
    try {
        const timestamp = Date.now();
        const studentRes = await fetch(`${baseUrl}/api/students/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Final Fetch Student',
                gmail: `fetch_${timestamp}@gmail.com`,
                studentId: `FETCH_${timestamp}`,
                phone: '0000000000'
            })
        });
        const data = await studentRes.json();
        if (studentRes.ok) {
            console.log('✅ Student API Check: SUCCESS', studentRes.status, data.message);
        } else {
            console.log('❌ Student API Check: FAILED', studentRes.status, data);
        }
    } catch (err) {
        console.error('❌ Student API Check: ERROR', err.message);
    }

    try {
        const timestamp = Date.now();
        const teacherRes = await fetch(`${baseUrl}/api/teachers/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Final Fetch Teacher',
                gmail: `fetch_t_${timestamp}@gmail.com`,
                teacherId: `FETCH_T_${timestamp}`,
                department: 'Testing',
                password: 'password123'
            })
        });
        const data = await teacherRes.json();
        if (teacherRes.ok) {
            console.log('✅ Teacher API Check: SUCCESS', teacherRes.status, data.message);
        } else {
            console.log('❌ Teacher API Check: FAILED', teacherRes.status, data);
        }
    } catch (err) {
        console.error('❌ Teacher API Check: ERROR', err.message);
    }
}

finalCheck();
