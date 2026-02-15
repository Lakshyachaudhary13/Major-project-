const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

module.exports = (db) => {

// Register a new teacher
router.post('/register', async (req, res) => {
    const { name, gmail, teacherId, department, password } = req.body;

    if (!name || !gmail || !teacherId || !password) {
        return res.status(400).json({ error: 'Name, Gmail, Teacher ID, and password are required' });
    }

    if (!gmail.endsWith('@gmail.com')) {
        return res.status(400).json({ error: 'Please use a valid Gmail address' });
    }

    try {
        const [existingRows] = await db.execute('SELECT teacherId FROM teachers WHERE teacherId = ?', [teacherId]);
        if (existingRows.length > 0) {
            return res.status(400).json({ error: 'Teacher ID already registered' });
        }

        const [gmailRows] = await db.execute('SELECT gmail FROM teachers WHERE gmail = ?', [gmail]);
        if (gmailRows.length > 0) {
            return res.status(400).json({ error: 'Gmail already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [insertResult] = await db.execute('INSERT INTO teachers (name, gmail, teacherId, department, password) VALUES (?, ?, ?, ?, ?)', [name, gmail, teacherId, department || null, hashedPassword]);
        
        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        console.error('Error registering teacher:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login a teacher
router.post('/login', async (req, res) => {
    const { gmail, teacherId, password } = req.body;

    if (!gmail || !teacherId || !password) {
        return res.status(400).json({ error: 'Gmail, Teacher ID, and password are required' });
    }

    try {
        const [loginResult] = await db.execute('SELECT * FROM teachers WHERE gmail = ? AND teacherId = ?', [gmail, teacherId]);
        const teacher = loginResult[0];

        if (!teacher) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, teacher.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        req.session.teacherId = teacher.teacherId;
        req.session.teacherName = teacher.name;
        req.session.teacherGmail = teacher.gmail;
        req.session.teacherDepartment = teacher.department;

        res.json({ message: 'Login successful', teacherId: teacher.teacherId, name: teacher.name, gmail: teacher.gmail, department: teacher.department });
    } catch (error) {
        console.error('Error querying teacher:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all teachers
router.get('/', async (req, res) => {
    try {
        const [result] = await db.execute('SELECT id, name, gmail, teacherId, department, createdAt FROM teachers ORDER BY createdAt DESC');
        res.json(result);
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

return router;
};
