const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

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
    if (!complaint.studentGmail) {
        console.warn(`[EMAIL] Skipping status update email for complaint ${complaint.id}: No student email found.`);
        return;
    }

    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: complaint.studentGmail,
            subject: `Update on Complaint #${complaint.id} - ${newStatus.toUpperCase()}`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #2563eb;">Complaint Status Updated</h2>
                    <p>Dear ${complaint.name},</p>
                    <p>The status of your complaint has been updated to: <strong style="color: #2563eb;">${newStatus.replace('-', ' ').toUpperCase()}</strong>.</p>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Complaint ID:</strong> #${complaint.id}</p>
                        <p><strong>Category:</strong> ${complaint.category}</p>
                        ${resolutionNotes ? `<p><strong>Teacher Note:</strong> ${resolutionNotes}</p>` : ''}
                    </div>
                    <p>You can track further updates on your student dashboard.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">This is an automated notification from the Complaint Management System.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Status update sent for #${complaint.id} (${newStatus})`);
    } catch (error) {
        console.error(`[EMAIL] Failed to send status update for #${complaint.id}:`, error.message);
        if (error.code === 'EAUTH') {
            console.error('[EMAIL] HINT: Gmail SMTP authentication failed. Check your EMAIL_USER and EMAIL_PASS in .env');
        }
    }
}

// Submit a new complaint
router.post('/', async (req, res) => {
    console.log('Complaint submission attempt');
    console.log('Session:', req.session);
    
    if (!req.session.studentId) {
        console.log('No studentId in session');
        return res.status(401).json({ error: 'Not logged in' });
    }

    const { type, description, category = 'general' } = req.body;
    const studentId = req.session.studentId;
    const studentName = req.session.studentName;
    const studentGmail = req.session.studentGmail;

    console.log('Complaint data:', { type, description, category, studentId, studentName, studentGmail });

    if (!type || !description) {
        return res.status(400).json({ error: 'Type and description are required' });
    }

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

    try {
        console.log('Attempting database insert...');
        const { error: insertError } = await supabase
            .from('complaints')
            .insert([{
                id, 
                name: studentName, 
                studentId, 
                studentEmail: studentGmail, 
                studentGmail, 
                type, 
                category, 
                description, 
                status: 'pending', 
                timestamp
            }]);

        if (insertError) throw insertError;
        console.log('Database insert successful');

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
        const { data: rows, error } = await supabase
            .from('complaints')
            .select('*')
            .eq('studentId', req.session.studentId)
            .order('timestamp', { ascending: false });

        if (error) throw error;
        res.json(rows || []);
    } catch (error) {
        console.error('Error fetching student complaints:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all complaints (admin only)
router.get('/', async (req, res) => {
    const { search, status, category } = req.query;
    
    let query = supabase.from('complaints').select('*');

    if (search) {
        query = query.or(`name.ilike.%${search}%,studentId.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (status) {
        query = query.eq('status', status);
    }
    if (category) {
        query = query.eq('category', category);
    }

    query = query.order('timestamp', { ascending: false });

    try {
        const { data: rows, error } = await query;
        if (error) throw error;
        res.json(rows || []);
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single complaint
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { data: complaint, error } = await supabase
            .from('complaints')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }
        res.json(complaint);
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
        const { data: complaint, error: fetchError } = await supabase
            .from('complaints')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        const oldStatus = complaint.status;
        const resolvedBy = req.session.teacherName || req.session.adminUsername || 'Admin';
        const resolvedAt = (status === 'resolved' || status === 'rejected') ? new Date().toISOString() : null;

        const { error: updateError } = await supabase
            .from('complaints')
            .update({ 
                status, 
                resolutionNotes: resolutionNotes || null, 
                resolvedBy, 
                resolvedAt 
            })
            .eq('id', id);

        if (updateError) throw updateError;

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
        const { data: complaint, error: fetchError } = await supabase
            .from('complaints')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        if (complaint.status !== 'resolved') {
            return res.status(400).json({ error: 'Can only delete resolved complaints' });
        }

        const { error: deleteError } = await supabase
            .from('complaints')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        res.json({ message: 'Complaint deleted successfully' });
    } catch (error) {
        console.error('Error deleting complaint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

return router;
};
