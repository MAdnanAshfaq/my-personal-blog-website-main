const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');

// Get comments for a post
router.get('/post/:postId', async (req, res) => {
    try {
        const comments = await Comment.find({
            postId: req.params.postId,
            status: 'approved'
        }).sort({ createdAt: -1 });
        
        res.json(comments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a comment
router.post('/post/:postId', async (req, res) => {
    try {
        const comment = new Comment({
            postId: req.params.postId,
            author: {
                name: req.body.name,
                email: req.body.email
            },
            content: req.body.content
        });

        const newComment = await comment.save();
        
        // Update comment count
        await Post.findByIdAndUpdate(req.params.postId, {
            $inc: { commentCount: 1 }
        });

        // Emit new comment event
        req.app.get('io').emit('newComment', {
            postId: req.params.postId,
            comment: newComment
        });

        res.status(201).json(newComment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Add reply to comment
router.post('/:commentId/reply', async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        
        comment.replies.push({
            author: {
                name: req.body.name,
                email: req.body.email
            },
            content: req.body.content
        });

        const updatedComment = await comment.save();
        
        req.app.get('io').emit('newReply', {
            commentId: req.params.commentId,
            reply: comment.replies[comment.replies.length - 1]
        });

        res.json(updatedComment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router; 