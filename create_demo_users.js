require('dotenv').config();
const https = require('https');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

function supabaseRequest(table, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
        const opts = {
            hostname: url.hostname,
            path: url.pathname + '?on_conflict=gmail',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'resolution=merge-duplicates',
                'Content-Length': Buffer.byteLength(data)
            }
        };
        const req = https.request(opts, res => {
            let responseData = '';
            res.on('data', d => responseData += d);
            res.on('end', () => resolve({ status: res.statusCode, body: responseData }));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function supabaseRequestAdmin(body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const url = new URL(`${SUPABASE_URL}/rest/v1/admins`);
        const opts = {
            hostname: url.hostname,
            path: url.pathname + '?on_conflict=username',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'resolution=merge-duplicates',
                'Content-Length': Buffer.byteLength(data)
            }
        };
        const req = https.request(opts, res => {
            let responseData = '';
            res.on('data', d => responseData += d);
            res.on('end', () => resolve({ status: res.statusCode, body: responseData }));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function createDemoAccounts() {
    const hash = await bcrypt.hash('password123', 10);
    console.log('[1] Inserting Admin...');
    const a = await supabaseRequestAdmin({ username: 'superadmin', password: hash });
    console.log(`    Status: ${a.status} | ${a.status < 300 ? 'SUCCESS - username: superadmin | password: password123' : a.body}`);

    console.log('[2] Inserting Student...');
    const s = await supabaseRequest('students', { name: 'Demo Student', gmail: 'studentdemo@gmail.com', studentId: 'S-101', phone: '9876543210', password: hash });
    console.log(`    Status: ${s.status} | ${s.status < 300 ? 'SUCCESS - gmail: studentdemo@gmail.com | studentId: S-101 | password: password123' : s.body}`);

    console.log('[3] Inserting Teacher...');
    const t = await supabaseRequest('teachers', { name: 'Prof. Demo', gmail: 'teacherdemo@gmail.com', teacherId: 'T-101', department: 'Computer Science', password: hash });
    console.log(`    Status: ${t.status} | ${t.status < 300 ? 'SUCCESS - gmail: teacherdemo@gmail.com | teacherId: T-101 | password: password123' : t.body}`);
}

createDemoAccounts();
