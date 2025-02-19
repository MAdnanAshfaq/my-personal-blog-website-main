const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    category: {
        type: String,
        required: true,
        trim: true
    },
    imageUrl: {
        type: String
    },
    searchKeywords: [String], // For better search functionality
    commentCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Add text search index
postSchema.index({
    title: 'text',
    content: 'text',
    tags: 'text',
    category: 'text'
});

module.exports = mongoose.model('Post', postSchema); 