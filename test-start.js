const path = require('path');
const fs = require('fs');

console.log('Testing server startup...');

// Test 1: Check if cert files exist
const certPath = path.join(__dirname, 'server', 'cert.pem');
const keyPath = path.join(__dirname, 'server', 'key.pem');

console.log('Checking certificate files...');
console.log('Cert exists:', fs.existsSync(certPath));
console.log('Key exists:', fs.existsSync(keyPath));

// Test 2: Try to require server
console.log('\nAttempting to start server...');
try {
    require('./server/server.js');
    console.log('Server required successfully');
} catch (err) {
    console.error('Error requiring server:', err.message);
    console.error(err.stack);
}

// Keep process alive for a bit to see if server starts
setTimeout(() => {
    console.log('Test complete');
    process.exit(0);
}, 3000);
