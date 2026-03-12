const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

module.exports = (supabase) => {

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
      // Check if student ID already exists in Supabase
      const { data: existingId, error: idError } = await supabase
        .from('students')
        .select('id')
        .eq('studentId', studentId)
        .single();

      if (existingId) {
        return res.status(400).json({ error: 'Student ID already registered' });
      }

      // Check if gmail already exists in Supabase
      const { data: existingGmail, error: gmailError } = await supabase
        .from('students')
        .select('id')
        .eq('gmail', gmail)
        .single();

      if (existingGmail) {
        return res.status(400).json({ error: 'Gmail already registered' });
      }

      const effectivePassword = password || 'temp123';
      const hashedPassword = await bcrypt.hash(effectivePassword, 10);

      const newStudent = {
        name,
        gmail,
        studentId,
        phone: phone || null,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };

      const { data: result, error: insertError } = await supabase
        .from('students')
        .insert([newStudent])
        .select();

      if (insertError) throw insertError;

      req.session.studentId = studentId;
      req.session.studentName = name;
      req.session.studentGmail = gmail;
      req.session.studentPhone = phone;

      res.status(201).json({ message: 'Registration successful', student: result[0] });
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
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('gmail', gmail)
        .eq('studentId', studentId)
        .single();

      if (error || !student) {
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

      res.json({ 
        message: 'Login successful', 
        studentId: student.studentId, 
        name: student.name, 
        gmail: student.gmail, 
        phone: student.phone 
      });
    } catch (error) {
      console.error('Error querying student:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get all students (hide password)
  router.get('/', async (req, res) => {
    try {
      const { data: students, error } = await supabase
        .from('students')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;

      const result = students.map(({ password, ...s }) => s);
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
  });

  return router;
};

