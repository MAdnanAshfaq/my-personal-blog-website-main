const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const jwt = require('jsonwebtoken');
const io = require('../config/io');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Add these at the top of your file
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, use environment variable
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // In production, use hashed password

// Login route
router.post('/login', async (req, res) => {
    try {
        console.log('Login request received:', req.body);
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            console.log('Missing credentials');
            return res.status(400).json({ message: 'Please provide username and password' });
        }

        // Check credentials
        if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
            console.log('Invalid credentials');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log('Login successful for user:', username);

        // Create token
        const token = jwt.sign(
            { userId: 'admin' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Send response
        const responseData = {
            token,
            user: {
                username: ADMIN_USERNAME,
                role: 'admin'
            }
        };

        console.log('Sending response:', responseData);
        res.json(responseData);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Protected routes - use auth middleware for everything EXCEPT login
router.use(auth); // Move this AFTER the login route

// Protected routes below
router.post('/posts', async (req, res) => {
    try {
        console.log('Received post data:', req.body); // Debug log

        const { title, content, category, image } = req.body;

        // Validate required fields
        if (!title || !content || !category) {
            return res.status(400).json({ 
                message: 'Missing required fields',
                required: ['title', 'content', 'category'],
                received: req.body
            });
        }

        const post = new Post({
            title,
            content,
            category,
            image: image || '',
            published: false
        });

        const savedPost = await post.save();
        console.log('Saved post:', savedPost); // Debug log

        res.status(201).json(savedPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ 
            message: 'Error creating post',
            error: error.message 
        });
    }
});

// Update post
router.put('/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category, image } = req.body;

        // Validate required fields
        if (!title || !content || !category) {
            return res.status(400).json({ 
                message: 'Missing required fields',
                required: ['title', 'content', 'category'],
                received: req.body
            });
        }

        const post = await Post.findByIdAndUpdate(
            id,
            { title, content, category, image },
            { new: true }
        );

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json(post);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ 
            message: 'Error updating post',
            error: error.message 
        });
    }
});

// Delete post
router.delete('/posts/:id', async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete(req.params.id);
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Emit deleted post id
        io.getIO().emit('deletePost', req.params.id);
        
        res.json({ message: 'Post deleted' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Add this route to your existing admin.js
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        res.json({
            url: req.file.path,
            public_id: req.file.filename
        });
    } catch (error) {
        res.status(500).json({ message: 'Image upload failed' });
    }
});

// Get all posts
router.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get single post
router.get('/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Invalid post ID' });
        }
        res.status(500).json({ message: error.message });
    }
});

// Toggle publish status
router.put('/posts/:id/publish', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { published } = req.body;

        const post = await Post.findByIdAndUpdate(
            id,
            { published },
            { new: true }
        );

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json(post);
    } catch (error) {
        console.error('Error updating publish status:', error);
        res.status(500).json({ message: 'Error updating publish status' });
    }
});

// Add a public route to get published posts
router.get('/public/posts', async (req, res) => {
    try {
        const posts = await Post.find({ isPublished: true })
            .sort({ publishedAt: -1 });
        res.json(posts);
    } catch (error) {
        console.error('Error fetching published posts:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 