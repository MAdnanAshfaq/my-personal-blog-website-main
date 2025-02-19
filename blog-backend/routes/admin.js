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
router.post('/posts', auth, async (req, res) => {
    try {
        console.log('Received post data:', req.body); // Debug log

        const { title, content, category, tags, imageUrl, author } = req.body;

        // Validate required fields
        if (!title || !content || !category) {
            return res.status(400).json({ 
                message: 'Title, content, and category are required',
                received: { title, content, category }
            });
        }

        const post = new Post({
            title,
            content,
            category,
            tags: tags || [],
            imageUrl: imageUrl || '',
            author: author || 'Admin'
        });

        const savedPost = await post.save();
        console.log('Saved post:', savedPost); // Debug log

        res.status(201).json(savedPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(400).json({ 
            message: error.message,
            details: error.errors // Include mongoose validation errors
        });
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

// Update post
router.put('/posts/:id', async (req, res) => {
    try {
        const { title, content, category, tags, imageUrl, author } = req.body;
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            {
                title,
                content,
                category,
                tags: tags || [],
                imageUrl: imageUrl || '',
                author: author || 'Admin',
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        );

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json(post);
    } catch (error) {
        console.error('Error updating post:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Invalid post ID' });
        }
        res.status(400).json({ message: error.message });
    }
});

// Delete post
router.delete('/posts/:id', async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Invalid post ID' });
        }
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 