const mysql = require('mysql2/promise');

(async () => {
  try {
    const pool = await mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Project@123',
      database: process.env.DB_NAME || 'complaint_db',
      waitForConnections: true,
      connectionLimit: 5
    });

    const [cols] = await pool.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'students'", [process.env.DB_NAME || 'complaint_db']);
    const existing = cols.map(c => c.COLUMN_NAME.toLowerCase());
    if (!existing.includes('gmail')) {
      await pool.query("ALTER TABLE students ADD COLUMN gmail VARCHAR(255) NOT NULL DEFAULT ''");
      console.log('Added column gmail');
    }
    if (!existing.includes('phone')) {
      await pool.query("ALTER TABLE students ADD COLUMN phone VARCHAR(50) DEFAULT NULL");
      console.log('Added column phone');
    }
    console.log('Students table schema verified/updated');
    await pool.end();
  } catch (err) {
    console.error('Error altering students table:', err.message);
    process.exit(1);
  }
})();
