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
      const teachersFile = path.join(__dirname, '../data/teachers.json');
      const teachers = await readJSON(teachersFile);

      if (teachers.find(t => t.teacherId === teacherId)) {
        return res.status(400).json({ error: 'Teacher ID already registered' });
      }

      if (teachers.find(t => t.gmail === gmail)) {
        return res.status(400).json({ error: 'Gmail already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newTeacher = {
        id: Date.now().toString(),
        name,
        gmail,
        teacherId,
        department: department || null,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };

      teachers.push(newTeacher);
      await writeJSON(teachersFile, teachers);

      res.status(201).json({ message: 'Registration successful', teacher: newTeacher });
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
      const teachersFile = path.join(__dirname, '../data/teachers.json');
      const teachers = await readJSON(teachersFile);
      const teacher = teachers.find(t => t.gmail === gmail && t.teacherId === teacherId);

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

  // Get all teachers (hide password)
  router.get('/', async (req, res) => {
    try {
      const teachersFile = path.join(__dirname, '../data/teachers.json');
      const teachers = await readJSON(teachersFile);
      const result = teachers.map(({ password, ...t }) => t).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      res.json(result);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Check teacher session
  router.get('/session', async (req, res) => {
    if (req.session.teacherId) {
      res.json({ 
        loggedIn: true, 
        teacherId: req.session.teacherId, 
        name: req.session.teacherName,
        gmail: req.session.teacherGmail,
        department: req.session.teacherDepartment
      });
    } else {
      res.status(401).json({ loggedIn: false, error: 'Not logged in' });
    }
  });

  // Logout teacher
  router.post('/logout', async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Could not log out' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  return router;
};

