const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
// selfsigned is lazy-loaded inside generateCertificates() to avoid crashes in serverless environments
require('dotenv').config();

const studentsRouter = require('./routes/students');
const complaintsRouter = require('./routes/complaints');
const analyticsRouter = require('./routes/analytics');
const teachersRouter = require('./routes/teachers');


const app = express();
const PORT = process.env.PORT || 8080;
const USE_HTTPS = process.env.USE_HTTPS === 'true'; // Set to 'true' in .env to enable HTTPS

// Generate self-signed certificates if not present
async function generateCertificates() {
    const keyPath = path.join(__dirname, 'key.pem');
    const certPath = path.join(__dirname, 'cert.pem');
    
    console.log('[CERT] Checking for certificates at:', keyPath);
    const keyExists = fs.existsSync(keyPath);
    const certExists = fs.existsSync(certPath);
    console.log('[CERT] Key exists:', keyExists, '| Cert exists:', certExists);
    
    if (!keyExists || !certExists) {
        console.log('[CERT] Generating self-signed certificates...');
        const attrs = [{ name: 'commonName', value: 'localhost' }];
        try {
            const selfsigned = require('selfsigned'); // lazy-load: only used locally
            const pems = await selfsigned.generate(attrs, { days: 365 });
            console.log('[CERT] Generated certificate data, writing files...');
            fs.writeFileSync(keyPath, pems.private);
            console.log('[CERT] Key written successfully');
            fs.writeFileSync(certPath, pems.cert);
            console.log('[CERT] Cert written successfully');
        } catch (err) {
            console.error('[CERT] Error generating or writing certificates:', err.message);
            throw err;
        }
    } else {
        console.log('[CERT] Certificate files already exist');
    }
}

// Supabase database setup
const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_KEY || '').trim();

if (!supabaseUrl || !supabaseKey) {
    console.error('CRITICAL: SUPABASE_URL or SUPABASE_KEY is missing. Database operations will fail.');
}

const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false
        }
    })
    : null;

// Middleware to check Supabase connection
const checkSupabase = (req, res, next) => {
    if (!supabase) {
        return res.status(503).json({ 
            error: 'Database connection not initialized. Please check backend environment variables.',
            details: 'SUPABASE_URL or SUPABASE_KEY is missing.'
        });
    }
    next();
};

app.use('/api', checkSupabase);

// Self-test database connection on startup
if (supabase) {
    supabase.from('students').select('*', { head: true, count: 'exact' })
        .then(({ error }) => {
            if (error) {
                console.error('[SUPABASE] Connection Test Failed:', error.message);
                if (error.code === 'PGRST205') {
                    console.error('[SUPABASE] HINT: Tables not found. Reach out to the user to run repair-database.sql');
                }
            } else {
                console.log('[SUPABASE] Connection Test Successful: Tables are accessible.');
            }
        });
}

// Initialize routers (Supabase mode)

// Schema is managed via Supabase Dashboard / MCP Migrations



// Security middleware
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://cdn.tailwindcss.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://cdn.tailwindcss.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
        },
    },
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // In development OR if ALLOWED_ORIGINS is not set, allow all
        if (process.env.NODE_ENV !== 'production' || !process.env.ALLOWED_ORIGINS) {
            return callback(null, true);
        }
        
        const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Body parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'UP', 
        supabase: !!supabase,
        env: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL
    });
});

// Debug environment variables (safe check)
app.get('/api/debug-env', (req, res) => {
    res.json({
        hasUrl: !!process.env.SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_KEY,
        urlLength: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.length : 0,
        vercel: !!process.env.VERCEL,
        nodeEnv: process.env.NODE_ENV
    });
});

// Global device tracking
const deviceTracker = new Map();

// Phone access logging middleware (only external traffic)
app.use((req, res, next) => {
    const fs = require('fs').promises;
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Skip logging for localhost and internal traffic
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.1.')) {
        return next();
    }

    // Extract device info from User-Agent
    let deviceInfo = 'Unknown Device';
    if (userAgent.includes('Android')) {
        deviceInfo = 'Android Phone';
        if (userAgent.includes('Samsung')) deviceInfo = 'Samsung Android Phone';
        else if (userAgent.includes('Google')) deviceInfo = 'Google Android Phone';
        else if (userAgent.includes('OnePlus')) deviceInfo = 'OnePlus Android Phone';
        else if (userAgent.includes('Xiaomi')) deviceInfo = 'Xiaomi Android Phone';
        else if (userAgent.includes('Huawei')) deviceInfo = 'Huawei Android Phone';
        else if (userAgent.includes('Oppo')) deviceInfo = 'Oppo Android Phone';
        else if (userAgent.includes('Vivo')) deviceInfo = 'Vivo Android Phone';
    } else if (userAgent.includes('iPhone')) {
        deviceInfo = 'iPhone';
        if (userAgent.includes('iPhone 15')) deviceInfo = 'iPhone 15';
        else if (userAgent.includes('iPhone 14')) deviceInfo = 'iPhone 14';
        else if (userAgent.includes('iPhone 13')) deviceInfo = 'iPhone 13';
        else if (userAgent.includes('iPhone 12')) deviceInfo = 'iPhone 12';
        else if (userAgent.includes('iPhone 11')) deviceInfo = 'iPhone 11';
    } else if (userAgent.includes('iPad')) {
        deviceInfo = 'iPad';
    } else if (userAgent.includes('Windows')) {
        deviceInfo = 'Windows PC';
    } else if (userAgent.includes('Mac')) {
        deviceInfo = 'Mac Computer';
    } else if (userAgent.includes('Linux')) {
        deviceInfo = 'Linux Device';
    }

    // Update device tracker with latest timestamp
    deviceTracker.set(ip, {
        timestamp,
        deviceInfo,
        userAgent,
        lastSeen: timestamp
    });

    // Immediately update phone file with all current devices (non-blocking)
    updatePhoneFile();

    next();
});

async function updatePhoneFile() {
    // Disable file operations on Vercel
    if (process.env.VERCEL) return;

    const fs = require('fs').promises;
    const phoneFilePath = path.join(__dirname, '..', 'phone');

    try {
        let content = '# Phone Access Log - Real-time Device Tracking\n';
        content += '# Format: Timestamp | IP Address | Device Info | User Agent | Status\n';
        content += '# Updated: ' + new Date().toISOString() + '\n\n';

        for (const [ip, device] of deviceTracker) {
            const status = 'ACTIVE';
            content += `${device.timestamp} | ${ip} | ${device.deviceInfo} | ${device.userAgent} | ${status}\n`;
        }

        await fs.writeFile(phoneFilePath, content);
    } catch (err) {
        console.error('Error updating phone file:', err);
    }
}

// Periodic cleanup of old devices (devices not seen for 1 hour)
setInterval(() => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    for (const [ip, device] of deviceTracker) {
        if (new Date(device.lastSeen) < oneHourAgo) {
            deviceTracker.delete(ip);
        }
    }

    // Update file after cleanup
    updatePhoneFile();
}, 5 * 60 * 1000); // Check every 5 minutes

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'complaint-management-secret', // Change this in production
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Set to true for HTTPS in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '..')));

// API routes
app.use('/api/students', studentsRouter(supabase));
app.use('/api/complaints', complaintsRouter(supabase));
app.use('/api/analytics', analyticsRouter(supabase));
app.use('/api/teachers', teachersRouter(supabase));

// Function to log admin actions
async function logAdminAction(timestamp, action, username, status, details) {
    const fs = require('fs').promises;
    const logFilePath = path.join(__dirname, '..', 'admin-tracking.txt');

    try {
        const logEntry = `${timestamp} | ${action} | ${username} | ${status} | ${details}\n`;
        await fs.appendFile(logFilePath, logEntry);
    } catch (err) {
        console.error('Error logging admin action:', err);
    }
}

// Admin registration route
app.post('/api/admin/register', async (req, res) => {
    const { username, password } = req.body; // Removed email as it's not stored
    const timestamp = new Date().toISOString();

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // Check if username already exists
        const { data: existingAdmin, error: fetchError } = await supabase
            .from('admins')
            .select('id')
            .eq('username', username)
            .single();

        if (existingAdmin) {
            // Log failed registration
            await logAdminAction(timestamp, 'REGISTER', username, 'FAILED', 'Username already exists');
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password and insert new admin
        const hashedPassword = await bcrypt.hash(password, 10);
        const { data: result, error: insertError } = await supabase
            .from('admins')
            .insert([{ username, password: hashedPassword }])
            .select();

        if (insertError) throw insertError;
        const adminId = result[0].id;

        // Log successful registration
        await logAdminAction(timestamp, 'REGISTER', username, 'SUCCESS', `Admin ID: ${adminId}`);

        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        console.error('Error registering admin:', error);
        // Log registration error
        await logAdminAction(timestamp, 'REGISTER', username, 'ERROR', 'Database error');
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin login route
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    const timestamp = new Date().toISOString();

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !admin) {
            // Log failed login attempt
            await logAdminAction(timestamp, 'LOGIN_FAILED', username, 'FAILED', 'Admin not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            // Log failed login attempt
            await logAdminAction(timestamp, 'LOGIN_FAILED', username, 'FAILED', 'Invalid password');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.adminId = admin.id;
        req.session.adminUsername = admin.username;

        // Log successful login
        await logAdminAction(timestamp, 'LOGIN_SUCCESS', username, 'SUCCESS', `Session ID: ${req.session.id}`);

        res.json({ message: 'Login successful', admin: { username: admin.username } });
    } catch (error) {
        console.error('Error querying admin:', error);
        // Log login error
        await logAdminAction(timestamp, 'LOGIN_FAILED', username, 'ERROR', 'Database query error');
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// Admin session check
app.get('/api/admin/session', (req, res) => {
    if (req.session.adminId) {
        res.json({
            adminId: req.session.adminId,
            adminUsername: req.session.adminUsername
        });
    } else {
        res.status(401).json({ error: 'Not logged in' });
    }
});

// Serve admin login page
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin-login.html'));
});

// Default route to serve student dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'student-dashboard.html'));
});

// Catch-all 404 for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        error: 'API endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(err.status || 500).json({ 
        error: err.message || 'Internal server error',
        path: req.path,
        method: req.method
    });
});

// Get local IP address
function getLocalIP() {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

// Function to get the public URL (ngrok or local)
function getPublicURL() {
    const fs = require('fs');
    const publicUrlPath = path.join(__dirname, '..', 'public-url.txt');
    
    // Check if public URL file exists (set by ngrok script)
    if (fs.existsSync(publicUrlPath)) {
        try {
            const publicUrl = fs.readFileSync(publicUrlPath, 'utf8').trim();
            if (publicUrl && publicUrl.startsWith('http')) {
                return publicUrl;
            }
        } catch (err) {
            console.log('[SERVER] Error reading public URL:', err.message);
        }
    }
    
    // Fall back to local IP
    const localIP = getLocalIP();
    return `http://${localIP}:${PORT}`;
}

// API endpoint to get public URL
app.get('/api/public-url', (req, res) => {
    const publicUrl = getPublicURL();
    res.json({ 
        publicUrl,
        localIP: getLocalIP(),
        port: PORT
    });
});

const LOCAL_IP = getLocalIP();

// Start server
async function startServer() {
    try {
        console.log('[SERVER] Starting server...');
        
        const HTTPS_PORT = process.env.HTTPS_PORT || 8443;
        
        // Always start HTTP server
        console.log('[SERVER] Creating HTTP server...');
        const httpServer = http.createServer(app);
        console.log('[SERVER] HTTP server created');
        
        httpServer.on('error', (err) => {
            console.error('[SERVER] HTTP Server error:', err);
        });
        
        console.log('[SERVER] Starting HTTP server on port', PORT);
        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`[SERVER] HTTP Server running on http://0.0.0.0:${PORT}`);
            console.log(`[SERVER] Access HTTP from current machine: http://127.0.0.1:${PORT}`);
            console.log(`[SERVER] Access from OTHER DEVICES/LAPTOP: http://${LOCAL_IP}:${PORT}`);
        });
        
        // Start HTTPS server if USE_HTTPS is enabled
        if (USE_HTTPS) {
            console.log('[SERVER] Generating certificates...');
            await generateCertificates();
            console.log('[SERVER] Certificates ready');
            
            const keyPath = path.join(__dirname, 'key.pem');
            const certPath = path.join(__dirname, 'cert.pem');
            console.log('[SERVER] Reading certificate files...');
            const key = fs.readFileSync(keyPath);
            const cert = fs.readFileSync(certPath);
            console.log('[SERVER] Certificate files read successfully');
            
            const httpsOptions = { key, cert };
            console.log('[SERVER] Creating HTTPS server...');
            const httpsServer = https.createServer(httpsOptions, app);
            console.log('[SERVER] HTTPS server created');
            
            httpsServer.on('error', (err) => {
                console.error('[SERVER] HTTPS Server error:', err);
            });
            
            console.log('[SERVER] Starting HTTPS server on port', HTTPS_PORT);
            httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
                console.log(`[SERVER] HTTPS Server running on https://0.0.0.0:${HTTPS_PORT}`);
                console.log(`[SERVER] Access HTTPS from current machine: https://127.0.0.1:${HTTPS_PORT}`);
                console.log(`[SERVER] Access HTTPS from other devices: https://YOUR_IP_ADDRESS:${HTTPS_PORT}`);
                console.log('[SERVER] Note: Self-signed certificate - browsers will show security warning');
            });
        } else {
            console.log('[SERVER] HTTPS is disabled. Set USE_HTTPS=true in .env to enable it.');
        }
        
        console.log('[SERVER] Both servers started successfully!');
        
    } catch (err) {
        console.error('[SERVER] Failed to start server:', err.message);
        console.error(err);
        process.exit(1);
    }
}

if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    // Export the app for serverless platforms like Vercel
    module.exports = app;
} else {
    startServer();
}
