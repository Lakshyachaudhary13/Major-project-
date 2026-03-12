const https = require('https');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL.trim();
const supabaseKey = process.env.SUPABASE_KEY.trim();

const data = JSON.stringify({
    name: 'Raw Test',
    gmail: `raw_${Date.now()}@gmail.com`,
    studentId: `RAW_${Date.now()}`,
    password: 'pass'
});

const url = new URL(supabaseUrl + '/rest/v1/students');
const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
};

console.log('--- RAW HTTP POST TEST ---');
console.log('URL:', url.toString());

const req = https.request(options, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Status Text:', res.statusMessage);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));

    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log('Body:', body);
    });
});

req.on('error', (e) => {
    console.error('Network Error:', e.message);
});

req.write(data);
req.end();
