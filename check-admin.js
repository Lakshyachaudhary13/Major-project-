const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Project@123',
    database: process.env.DB_NAME || 'complaint_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.execute('SELECT * FROM admins', [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Admins in database:');
        rows.forEach(row => {
            console.log(row);
        });
    }
    db.end();
});
