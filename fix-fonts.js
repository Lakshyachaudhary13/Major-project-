const fs = require('fs');
const path = require('path');
const dir = '.';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(f => {
    const p = path.join(dir, f);
    let content = fs.readFileSync(p, 'utf8');
    
    // Replace the various broken material symbol links
    content = content.replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Material\+Symbols\+Outlined.*?" rel="stylesheet"\s*\/?>/g, '');
    
    // Insert the correct link after the Inter font link
    if (!content.includes('opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200')) {
        content = content.replace(/(<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Inter.*?" rel="stylesheet"\s*\/?>)/, '$1\n    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />');
    }
    
    // Fix index.html exact matching for transparency
    if (f === 'index.html') {
        content = content.replace('nav class="glass dark:glass-dark w-full max-w-7xl rounded-2xl px-8 py-3 flex items-center justify-between shadow-sm"', 'nav class="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md w-full max-w-7xl rounded-2xl px-8 py-3 flex items-center justify-between shadow-sm"');
    }

    fs.writeFileSync(p, content);
});
console.log('Fixed Material Icons URLs and nav transparency');
