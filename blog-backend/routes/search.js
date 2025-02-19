const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// Search posts
router.get('/', async (req, res) => {
    try {
        const { q, category, tag } = req.query;
        let query = {};

        // Text search
        if (q) {
            query.$text = { $search: q };
        }

        // Category filter
        if (category) {
            query.category = category;
        }

        // Tag filter
        if (tag) {
            query.tags = tag;
        }

        const posts = await Post.find(query)
            .sort({ score: { $meta: 'textScore' } })
            .limit(20);

        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get categories with post counts
router.get('/categories', async (req, res) => {
    try {
        const categories = await Post.aggregate([
            { $group: {
                _id: '$category',
                count: { $sum: 1 }
            }},
            { $sort: { count: -1 } }
        ]);
        
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get popular tags
router.get('/tags', async (req, res) => {
    try {
        const tags = await Post.aggregate([
            { $unwind: '$tags' },
            { $group: {
                _id: '$tags',
                count: { $sum: 1 }
            }},
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]);
        
        res.json(tags);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 