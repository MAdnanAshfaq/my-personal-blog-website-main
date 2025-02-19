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
        enum: ['Technology', 'Lifestyle', 'Travel']
    },
    image: {
        type: String,
        required: false
    },
    published: {
        type: Boolean,
        default: false
    },
    searchKeywords: [String], // For better search functionality
    commentCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
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

// Update timestamps on save
postSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Post', postSchema); 