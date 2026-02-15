const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

module.exports = (db) => {

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

// Check if complaint is expired (older than 24 hours)
function isComplaintExpired(timestamp) {
    const now = new Date();
    const complaintTime = new Date(timestamp);
    const diffInMs = now - complaintTime;
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
    return diffInMs > twentyFourHoursInMs;
}

// Send email for complaint submission
async function sendComplaintEmail(complaint, studentGmail) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: studentGmail,
        subject: 'Complaint Submitted Successfully',
        html: `
            <h2>Complaint Submitted</h2>
            <p>Dear ${complaint.name},</p>
            <p>Your ${complaint.category} complaint has been submitted successfully.</p>
            <p><strong>Complaint ID:</strong> ${complaint.id}</p>
            <p><strong>Description:</strong> ${complaint.description}</p>
            <p><strong>Submitted:</strong> ${new Date(complaint.timestamp).toLocaleString()}</p>
            <p>You will receive updates on the status of your complaint.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Complaint email sent successfully');
    } catch (error) {
        console.error('Error sending complaint email:', error);
    }
}

// Send email for status update
async function sendStatusUpdateEmail(complaint, newStatus, resolutionNotes) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: complaint.studentGmail,
            subject: `Complaint Status Updated - ${newStatus.charAt(0).toUpperCase() + newStatus.replace('-', ' ')}`,
            html: `
                <h2>Complaint Status Update</h2>
                <p>Dear ${complaint.name},</p>
                <p>The status of your complaint has been updated.</p>
                <p><strong>Complaint ID:</strong> ${complaint.id}</p>
                <p><strong>Category:</strong> ${complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1)}</p>
                <p><strong>Description:</strong> ${complaint.description}</p>
                <p><strong>New Status:</strong> ${newStatus.charAt(0).toUpperCase() + newStatus.replace('-', ' ')}</p>
                ${resolutionNotes ? `<p><strong>Resolution Notes:</strong> ${resolutionNotes}</p>` : ''}
                <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Status update email sent successfully');
    } catch (error) {
        console.error('Error sending status update email:', error);
    }
}

// Submit a new complaint
router.post('/', async (req, res) => {
    if (!req.session.studentId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const { type, description, category = 'general' } = req.body;
    const studentId = req.session.studentId;
    const studentName = req.session.studentName;
    const studentGmail = req.session.studentGmail;

    if (!type || !description) {
        return res.status(400).json({ error: 'Type and description are required' });
    }

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toISOString();

    try {
        await db.execute('INSERT INTO complaints (id, name, studentId, studentGmail, type, category, description, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, studentName, studentId, studentGmail, type, category, description, 'pending', timestamp]);

        const newComplaint = { id, name: studentName, studentId, studentGmail, type, category, description, status: 'pending', timestamp };

        // Send email to student
        if (studentGmail) {
            sendComplaintEmail(newComplaint, studentGmail);
        }

        res.status(201).json({ message: 'Complaint submitted successfully', complaint: newComplaint });
    } catch (error) {
        console.error('Error inserting complaint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get complaints for the logged-in student
router.get('/my', async (req, res) => {
    if (!req.session.studentId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM complaints WHERE studentId = ? ORDER BY timestamp DESC', [req.session.studentId]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching student complaints:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all complaints (admin only)
router.get('/', async (req, res) => {
    const { search, status, category } = req.query;
    
    let query = 'SELECT * FROM complaints WHERE 1=1';
    const params = [];

    if (search) {
        query += ' AND (name LIKE ? OR studentId LIKE ? OR description LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }
    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }
    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }

    query += ' ORDER BY timestamp DESC';

    try {
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single complaint
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.execute('SELECT * FROM complaints WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Complaint not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching complaint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update complaint status (admin only)
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    try {
        const [rows] = await db.execute('SELECT * FROM complaints WHERE id = ?', [id]);
        const complaint = rows[0];

        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        const oldStatus = complaint.status;
        const resolvedBy = req.session.teacherName || req.session.adminUsername || 'Admin';
        const resolvedAt = (status === 'resolved' || status === 'rejected') ? new Date().toISOString() : null;

        await db.execute('UPDATE complaints SET status = ?, resolutionNotes = ?, resolvedBy = ?, resolvedAt = ? WHERE id = ?', 
            [status, resolutionNotes || null, resolvedBy, resolvedAt, id]);

        complaint.status = status;
        complaint.resolutionNotes = resolutionNotes;
        complaint.resolvedBy = resolvedBy;

        // Send email notification for status update
        if (oldStatus !== status) {
            sendStatusUpdateEmail(complaint, status, resolutionNotes);
        }

        res.json({ message: 'Status updated successfully', complaint });
    } catch (error) {
        console.error('Error updating complaint status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a resolved complaint (admin only)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.execute('SELECT * FROM complaints WHERE id = ?', [id]);
        const complaint = rows[0];

        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        if (complaint.status !== 'resolved') {
            return res.status(400).json({ error: 'Can only delete resolved complaints' });
        }

        await db.execute('DELETE FROM complaints WHERE id = ?', [id]);

        res.json({ message: 'Complaint deleted successfully' });
    } catch (error) {
        console.error('Error deleting complaint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

return router;
};
