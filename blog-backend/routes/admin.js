const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const jwt = require('jsonwebtoken');

// Login route - NO AUTH MIDDLEWARE
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('Login attempt:', { username }); // Debug log

        // Check if credentials are present
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Replace with your actual admin credentials
        if (username === 'admin' && password === 'admin123') {
            if (!process.env.JWT_SECRET) {
                console.error('JWT_SECRET is not set');
                return res.status(500).json({ message: 'Server configuration error' });
            }

            const token = jwt.sign(
                { username: username },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            console.log('Login successful for:', username);
            return res.json({ 
                token,
                message: 'Login successful' 
            });
        } else {
            console.log('Invalid credentials for:', username);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Protected routes - use auth middleware for everything EXCEPT login
router.use(auth); // Move this AFTER the login route

// Protected routes below
router.post('/posts', async (req, res) => {
    try {
        const post = new Post({
            title: req.body.title,
            content: req.body.content,
            author: req.body.author,
            tags: req.body.tags,
            imageUrl: req.body.imageUrl
        });

        const newPost = await post.save();
        
        // Emit new post to all connected clients
        req.app.get('io').emit('newPost', newPost);
        
        res.status(201).json(newPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update post
router.put('/posts/:id', async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Emit updated post
        req.app.get('io').emit('updatePost', post);
        
        res.json(post);
    } catch (err) {
        res.status(400).json({ message: err.message });
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
        req.app.get('io').emit('deletePost', req.params.id);
        
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

module.exports = router; 