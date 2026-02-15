/*
 * MySQL Connection Test Script
 * Tests the MySQL database connection and tables
 */

const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool
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

console.log('\n=== MySQL Connection Test ===\n');
console.log('Configuration:');
console.log(`  Host: ${process.env.DB_HOST}`);
console.log(`  Port: ${process.env.DB_PORT}`);
console.log(`  User: ${process.env.DB_USER}`);
console.log(`  Database: ${process.env.DB_NAME}`);
console.log('\nAttempting to connect...\n');

// Test the connection
db.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('❌ Database connection was closed.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('❌ Database has too many connections.');
        }
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('❌ Database access denied - check username/password.');
        }
        if (err.code === 'ER_BAD_DB_ERROR') {
            console.error('❌ Database does not exist.');
        }
        console.error('Connection Error:', err.message);
        process.exit(1);
    }

    if (connection) {
        connection.release();
        console.log('✅ MySQL Connection Successful!\n');

        // Test database queries
        console.log('Checking tables...\n');

        // Check students table
        db.execute('DESCRIBE students', (err, results) => {
            if (!err) {
                console.log('✅ students table exists');
                console.log('   Columns:', results.map(r => r.Field).join(', '));
            } else {
                console.log('⚠️  students table not found or error:', err.message);
            }

            // Check complaints table
            db.execute('DESCRIBE complaints', (err, results) => {
                if (!err) {
                    console.log('\n✅ complaints table exists');
                    console.log('   Columns:', results.map(r => r.Field).join(', '));
                } else {
                    console.log('⚠️  complaints table not found or error:', err.message);
                }

                // Check teachers table
                db.execute('DESCRIBE teachers', (err, results) => {
                    if (!err) {
                        console.log('\n✅ teachers table exists');
                        console.log('   Columns:', results.map(r => r.Field).join(', '));
                    } else {
                        console.log('⚠️  teachers table not found or error:', err.message);
                    }

                    // Count records
                    db.execute('SELECT COUNT(*) as count FROM students', (err, results) => {
                        console.log('\n--- Data Count ---');
                        if (!err) {
                            console.log(`Students: ${results[0].count}`);
                        }

                        db.execute('SELECT COUNT(*) as count FROM complaints', (err, results) => {
                            if (!err) {
                                console.log(`Complaints: ${results[0].count}`);
                            }

                            db.execute('SELECT COUNT(*) as count FROM teachers', (err, results) => {
                                if (!err) {
                                    console.log(`Teachers: ${results[0].count}`);
                                }

                                console.log('\n=== Test Complete ===\n');
                                process.exit(0);
                            });
                        });
                    });
                });
            });
        });
    }
});
