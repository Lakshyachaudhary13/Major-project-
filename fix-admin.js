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

async function fixAdminPassword() {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    db.execute('UPDATE admins SET password = ? WHERE username = ?', [hashedPassword, 'admin'], function(err, result) {
        if (err) {
            console.error('Error updating admin password:', err);
        } else {
            console.log('Admin password updated successfully');
        }
        db.end();
    });
}

fixAdminPassword();
