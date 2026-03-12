const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

module.exports = (supabase) => {

// Email configuration (replace with your SMTP settings)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Send teacher registration confirmation email
async function sendTeacherRegistrationEmail(teacher) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: teacher.gmail,
        subject: 'Welcome to Complaint Management System - Teacher Registration Successful',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">Welcome, ${teacher.name}!</h2>
                <p>Your teacher account has been created successfully.</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p><strong>Name:</strong> ${teacher.name}</p>
                    <p><strong>Teacher ID:</strong> ${teacher.teacherId}</p>
                    <p><strong>Email:</strong> ${teacher.gmail}</p>
                    <p><strong>Department:</strong> ${teacher.department || 'Not provided'}</p>
                </div>
                <p>You can now login to manage complaints and assist students.</p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    If you have any questions, please contact the administrator.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Teacher registration email sent successfully');
    } catch (error) {
        console.error('Error sending teacher registration email:', error);
    }
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
        const { data: existingRows } = await supabase
            .from('teachers')
            .select('teacherId')
            .eq('teacherId', teacherId);

        if (existingRows && existingRows.length > 0) {
            return res.status(400).json({ error: 'Teacher ID already registered' });
        }

        const { data: gmailRows } = await supabase
            .from('teachers')
            .select('gmail')
            .eq('gmail', gmail);

        if (gmailRows && gmailRows.length > 0) {
            return res.status(400).json({ error: 'Gmail already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const { error: insertError } = await supabase
            .from('teachers')
            .insert([{ name, gmail, teacherId, department: department || null, password: hashedPassword }]);
        
        if (insertError) throw insertError;
        
        // Send registration confirmation email
        const teacher = { name, gmail, teacherId, department };
        sendTeacherRegistrationEmail(teacher);

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

        res.json({ message: 'Login successful', teacherId: teacher.teacherId, name: teacher.name, gmail: teacher.gmail, department: teacher.department });
    } catch (error) {
        console.error('Error querying teacher:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all teachers
router.get('/', async (req, res) => {
    try {
        const { data: result, error } = await supabase
            .from('teachers')
            .select('id, name, gmail, teacherId, department, createdAt')
            .order('createdAt', { ascending: false });

        if (error) throw error;
        res.json(result || []);
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

