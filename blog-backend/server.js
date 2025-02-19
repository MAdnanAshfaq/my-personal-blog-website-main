const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const ioConfig = require('./config/io');
const Post = require('./models/Post');
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Configure CORS - Updated to be more permissive for development
app.use(cors({
    origin: '*',  // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Get the paths to directories
const backendDir = __dirname;
const rootDir = path.join(__dirname, '..');
const adminDir = path.join(rootDir, 'admin');
const publicDir = path.join(rootDir, 'public');
console.log('Admin directory:', adminDir);

// Serve static files from admin directory
app.use(express.static(adminDir));
app.use('/admin', express.static(adminDir));
app.use('/public', express.static(publicDir));

// Debug route
app.get('/debug', (req, res) => {
    const loginPath = path.join(adminDir, 'login.html');
    const indexPath = path.join(adminDir, 'index.html');
    
    res.json({
        adminDir,
        loginExists: fs.existsSync(loginPath),
        indexExists: fs.existsSync(indexPath),
        loginPath,
        indexPath,
        adminFiles: fs.readdirSync(adminDir)
    });
});

// Routes for HTML pages
app.get('/', (req, res) => {
    try {
        const filePath = path.join(adminDir, 'login.html');
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            console.error('File not found:', filePath);
            res.status(404).send('Login page not found');
        }
    } catch (error) {
        console.error('Error serving login page:', error);
        res.status(500).send('Error serving login page');
    }
});

app.get('/login.html', (req, res) => {
    try {
        const filePath = path.join(adminDir, 'login.html');
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            console.error('File not found:', filePath);
            res.status(404).send('Login page not found');
        }
    } catch (error) {
        console.error('Error serving login page:', error);
        res.status(500).send('Error serving login page');
    }
});

app.get('/index.html', (req, res) => {
    try {
        const filePath = path.join(adminDir, 'index.html');
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            console.error('File not found:', filePath);
            res.status(404).send('Index page not found');
        }
    } catch (error) {
        console.error('Error serving index page:', error);
        res.status(500).send('Error serving index page');
    }
});

// API routes
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');

app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

// Add search routes
app.use('/api/search', require('./routes/search'));

// Database connection
mongoose.connect('mongodb://localhost:27017/blog', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Socket.IO setup with CORS
const io = new Server(server, {
    cors: {
        origin: '*',  // Allow all origins in development
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

// Initialize io configuration
ioConfig.init(io);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error details:', err);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
    console.log(`Public blog: http://localhost:${PORT}/public`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
}); 