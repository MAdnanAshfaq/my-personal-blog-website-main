const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    author: {
        name: { type: String, required: true },
        email: { type: String, required: true }
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    replies: [{
        author: {
            name: String,
            email: String
        },
        content: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema); 