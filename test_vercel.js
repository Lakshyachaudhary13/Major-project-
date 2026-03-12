const https = require('https');

const data = JSON.stringify({
    name: 'Vercel Deployment Test',
    gmail: `vtest_${Date.now()}@gmail.com`,
    studentId: `VT_${Date.now()}`,
    password: 'pass'
});

const options = {
    hostname: 'major-project-lakshya3.vercel.app',
    path: '/api/students/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log(`Body: ${body}`);
    });
});

req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
});

req.write(data);
req.end();
