/*
 * Initialize Missing Database Tables
 */

const mysql = require('mysql2');
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

console.log('\n=== Initializing Missing Tables ===\n');

// Create teachers table
db.execute(`CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    gmail VARCHAR(255),
    teacherId VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    department VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`, (err, results) => {
    if (err) {
        console.error('❌ Error creating teachers table:', err.message);
    } else {
        console.log('✅ teachers table initialized');
    }

    // Create admins table
    db.execute(`CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err, results) => {
        if (err) {
            console.error('❌ Error creating admins table:', err.message);
        } else {
            console.log('✅ admins table initialized');
        }

        // Create complaint_history table
        db.execute(`CREATE TABLE IF NOT EXISTS complaint_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            complaintId VARCHAR(255) NOT NULL,
            status VARCHAR(255) NOT NULL,
            changedBy VARCHAR(255),
            notes TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (complaintId) REFERENCES complaints (id)
        )`, (err, results) => {
            if (err) {
                console.error('❌ Error creating complaint_history table:', err.message);
            } else {
                console.log('✅ complaint_history table initialized');
            }

            console.log('\n=== Initialization Complete ===\n');
            process.exit(0);
        });
    });
});
