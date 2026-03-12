const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

module.exports = () => {

  // JSON utils
  async function readJSON(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async function writeJSON(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  // Register a new student
  router.post('/register', async (req, res) => {
    const { name, gmail, studentId, phone, password } = req.body;

    if (!name || !gmail || !studentId) {
      return res.status(400).json({ error: 'Name, Gmail, and student ID are required' });
    }

    if (!gmail.endsWith('@gmail.com')) {
      return res.status(400).json({ error: 'Please use a valid Gmail address' });
    }

    try {
      const studentsFile = path.join(__dirname, '../data/students.json');
      const students = await readJSON(studentsFile);

      if (students.find(s => s.studentId === studentId)) {
        return res.status(400).json({ error: 'Student ID already registered' });
      }

      if (students.find(s => s.gmail === gmail)) {
        return res.status(400).json({ error: 'Gmail already registered' });
      }

      const effectivePassword = password || 'temp123';
      const hashedPassword = await bcrypt.hash(effectivePassword, 10);

      const newStudent = {
        id: Date.now().toString(),
        name,
        email: gmail,
        gmail,
        studentId,
        phone: phone || null,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };

      students.push(newStudent);
      await writeJSON(studentsFile, students);

      req.session.studentId = studentId;
      req.session.studentName = name;
      req.session.studentGmail = gmail;
      req.session.studentPhone = phone;

      res.status(201).json({ message: 'Registration successful', student: newStudent });
    } catch (error) {
      console.error('Error registering student:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Login a student
  router.post('/login', async (req, res) => {
    const { studentId, gmail, password } = req.body;

    if (!studentId || !gmail) {
      return res.status(400).json({ error: 'Gmail and Student ID are required' });
    }

    try {
      const studentsFile = path.join(__dirname, '../data/students.json');
      const students = await readJSON(studentsFile);
      const student = students.find(s => s.gmail === gmail && s.studentId === studentId);

      if (!student) {
        return res.status(401).json({ error: 'Invalid login credentials. Please check your Gmail and Student ID.' });
      }

      if (password) {
        const isPasswordValid = await bcrypt.compare(password, student.password);
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid password' });
        }
      }

      req.session.studentId = student.studentId;
      req.session.studentName = student.name;
      req.session.studentGmail = student.gmail;
      req.session.studentPhone = student.phone;

      res.json({ message: 'Login successful', studentId: student.studentId, name: student.name, gmail: student.gmail, phone: student.phone });
    } catch (error) {
      console.error('Error querying student:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get all students (hide password)
  router.get('/', async (req, res) => {
    try {
      const studentsFile = path.join(__dirname, '../data/students.json');
      const students = await readJSON(studentsFile);
      const result = students.map(({ password, ...s }) => s).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      res.json(result);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Logout
  router.post('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) return res.status(500).json({ error: 'Could not log out' });
      res.json({ message: 'Logout successful' });
    });
  });

  // Session
  router.get('/session', (req, res) => {
    if (req.session.studentId) {
      res.json({
        studentId: req.session.studentId,
        studentName: req.session.studentName,
        studentGmail: req.session.studentGmail,
        studentPhone: req.session.studentPhone
      });
    } else {
      res.status(401).json({ error: 'Not logged in' });
    }
            studentPhone: req.session.studentPhone
        });
    } else {
        res.status(401).json({ error: 'Not logged in' });
    }
});

return router;
};
