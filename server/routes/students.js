const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

module.exports = (supabase) => {

// Email configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Send student registration confirmation email
async function sendStudentRegistrationEmail(student) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: student.gmail,
        subject: 'Welcome to Complaint Management System - Registration Successful',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4f46e5;">Welcome, ${student.name}!</h2>
                <p>Your student account has been created successfully.</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p><strong>Name:</strong> ${student.name}</p>
                    <p><strong>Student ID:</strong> ${student.studentId}</p>
                    <p><strong>Email:</strong> ${student.gmail}</p>
                    <p><strong>Phone:</strong> ${student.phone || 'Not provided'}</p>
                </div>
                <p>You can now login to submit complaints and track their status.</p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    If you have any questions, please contact the administrator.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Student registration email sent successfully');
    } catch (error) {
        console.error('Error sending student registration email:', error);
    }
}

// Register a new student
router.post('/register', async (req, res) => {
    const { name, gmail, studentId, phone } = req.body;

    if (!name || !gmail || !studentId) {
        return res.status(400).json({ error: 'Name, Gmail, and student ID are required' });
    }

    if (!gmail.endsWith('@gmail.com')) {
        return res.status(400).json({ error: 'Please use a valid Gmail address' });
    }

    try {
        const { data: existingRow } = await supabase.from('students').select('studentId').eq('studentId', studentId).single();
        if (existingRow) {
            return res.status(400).json({ error: 'Student ID already registered' });
        }

        const { data: gmailRow } = await supabase.from('students').select('gmail').eq('gmail', gmail).single();
        if (gmailRow) {
            return res.status(400).json({ error: 'Gmail already registered' });
        }

        const { data: insertResult, error } = await supabase.from('students').insert([
            { name, email: gmail, gmail, studentId, phone: phone || null }
        ]).select();

        if (error) throw error;
        
        req.session.studentId = studentId;
        req.session.studentName = name;
        req.session.studentGmail = gmail;
        req.session.studentPhone = phone;

        // Send registration confirmation email
        const student = { name, gmail, studentId, phone };
        sendStudentRegistrationEmail(student);

        res.status(201).json({ message: 'Registration successful', student: insertResult[0] });
    } catch (error) {
        console.error('Error registering student:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login a student — requires BOTH gmail AND studentId to match
router.post('/login', async (req, res) => {
    const { studentId, gmail } = req.body;

    if (!studentId || !gmail) {
        return res.status(400).json({ error: 'Both Gmail and Student ID are required' });
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

        req.session.studentId = student.studentId;
        req.session.studentName = student.name;
        req.session.studentGmail = student.gmail;
        req.session.studentEmail = student.email;
        req.session.studentPhone = student.phone;

        res.json({ message: 'Login successful', studentId: student.studentId, name: student.name, gmail: student.gmail, phone: student.phone });
    } catch (error) {
        console.error('Error querying student:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all registered students
router.get('/', async (req, res) => {
    try {
        const { data: result, error } = await supabase.from('students').select('id, name, gmail, studentId, phone, createdAt').order('createdAt', { ascending: false });
        if (error) throw error;
        res.json(result || []);
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

// Get current session info
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
