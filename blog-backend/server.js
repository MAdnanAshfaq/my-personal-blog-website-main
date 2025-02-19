const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configure CORS
const corsOptions = {
    origin: ['http://localhost:3000'], // Add admin panel URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));

// Configure Socket.IO with CORS
const io = socketIo(server, {
    cors: {
        origin: true, // Allow all origins for development
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization", "Referrer-Policy"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Middleware
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });

    socket.on('disconnect', (reason) => {
        console.log('Client disconnected:', socket.id, 'Reason:', reason);
    });
});

// Add global error handler for Socket.IO
io.engine.on('connection_error', (err) => {
    console.error('Connection error:', err);
});

// Make io available in routes
app.set('io', io);

// Routes
const postsRouter = require('./routes/posts');
const adminRouter = require('./routes/admin');
const commentsRouter = require('./routes/comments');
const searchRouter = require('./routes/search');

app.use('/api/posts', postsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/search', searchRouter);

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Blog API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 