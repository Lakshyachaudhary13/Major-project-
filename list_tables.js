const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function listAll() {
    const s = createClient(process.env.SUPABASE_URL.trim(), process.env.SUPABASE_KEY.trim());
    
    // Try to query the internal schema information
    console.log('Querying schema definition...');
    const { data, error } = await s.rpc('get_service_status'); // This might not exist
    if (error) console.log('RPC error:', error.message);

    // Try to select from a non-existent table to see if it gives a hint
    const { error: err2 } = await s.from('non_existent').select('*');
    if (err2) console.log('Non-existent error:', err2.message);

    // Try to see if we can get the definitions from the root
    const https = require('https');
    const url = new URL(process.env.SUPABASE_URL + '/rest/v1/');
    const options = {
        hostname: url.hostname,
        path: url.pathname,
        headers: {
            'apikey': process.env.SUPABASE_KEY.trim(),
            'Authorization': 'Bearer ' + process.env.SUPABASE_KEY.trim()
        }
    };

    https.get(options, (res) => {
        let body = '';
        res.on('data', (d) => body += d);
        res.on('end', () => {
            try {
                const j = JSON.parse(body);
                console.log('\nExposed Tables:', Object.keys(j.definitions || {}));
            } catch(e) {
                console.log('\nCould not parse internal definitions.');
            }
        });
    });
}

listAll();
