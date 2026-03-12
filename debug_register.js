const http = require('http');

const data = JSON.stringify({
    name: 'Test Student',
    gmail: 'test@gmail.com',
    studentId: 'S' + Date.now(),
    phone: '1234567890',
    password: 'password123'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/students/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log('Body:', body);
    });
});

req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
});

req.write(data);
req.end();
