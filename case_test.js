const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function caseSensitivityTest() {
    const s = createClient(process.env.SUPABASE_URL.trim(), process.env.SUPABASE_KEY.trim());
    const tableBaseNames = ['students', 'teachers', 'complaints', 'admins'];
    
    for (const base of tableBaseNames) {
        console.log(`\n--- Testing variations for: ${base} ---`);
        const variations = [
            base.toLowerCase(),
            base.toUpperCase(),
            base.charAt(0).toUpperCase() + base.slice(1), // Capitalized
            `"${base}"`, // Double quoted in code (though supabase-js handles this)
        ];

        for (const v of variations) {
            const { error, status } = await s.from(v).select('*', { head: true });
            if (!error) {
                console.log(`✅ FOUND: [${v}] (Status: ${status})`);
            } else {
                console.log(`❌ [${v}]: ${error.message}`);
            }
        }
    }
}

caseSensitivityTest();
