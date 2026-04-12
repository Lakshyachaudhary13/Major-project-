const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

module.exports = (supabase) => {

  router.post('/register', async (req, res) => {
    const { name, gmail, teacherId, department, password } = req.body;

    if (!name || !gmail || !teacherId || !password) {
      return res.status(400).json({ error: 'Name, Gmail, Teacher ID, and password are required' });
    }

    if (!gmail.endsWith('@gmail.com')) {
      return res.status(400).json({ error: 'Please use a valid Gmail address' });
    }

    try {

      const { data: existingId, error: idError } = await supabase
        .from('teachers')
        .select('id')
        .eq('teacherId', teacherId)
        .single();

      if (existingId) {
        return res.status(400).json({ error: 'Teacher ID already registered' });
      }

      const { data: existingGmail, error: gmailError } = await supabase
        .from('teachers')
        .select('id')
        .eq('gmail', gmail)
        .single();

      if (existingGmail) {
        return res.status(400).json({ error: 'Gmail already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newTeacher = {
        name,
        gmail,
        teacherId,
        department: department || null,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };

      const { data: result, error: insertError } = await supabase
        .from('teachers')
        .insert([newTeacher])
        .select();

      if (insertError) throw insertError;

      res.status(201).json({ message: 'Registration successful', teacher: result[0] });
    } catch (error) {
      console.error('Error registering teacher:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/login', async (req, res) => {
    const { gmail, teacherId, password } = req.body;

    if (!gmail || !teacherId || !password) {
      return res.status(400).json({ error: 'Gmail, Teacher ID, and password are required' });
    }

    try {
      const { data: teacher, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('gmail', gmail)
        .eq('teacherId', teacherId)
        .single();

      if (error || !teacher) {
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

      res.json({ 
        message: 'Login successful', 
        teacherId: teacher.teacherId, 
        name: teacher.name, 
        gmail: teacher.gmail, 
        department: teacher.department 
      });
    } catch (error) {
      console.error('Error querying teacher:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const { data: teachers, error } = await supabase
        .from('teachers')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;

      const result = teachers.map(({ password, ...t }) => t);
      res.json(result);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

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
