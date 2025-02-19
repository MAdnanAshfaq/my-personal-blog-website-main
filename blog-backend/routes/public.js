const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// Get all published posts
router.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find({ published: true })
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Error fetching posts' });
    }
});

// Get a single published post
router.get('/posts/:id', async (req, res) => {
    try {
        const post = await Post.findOne({ 
            _id: req.params.id,
            published: true 
        });
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        res.json(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ message: 'Error fetching post' });
    }
});

module.exports = router; 