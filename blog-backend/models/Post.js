const mongoose = require('mongoose');

// Clear the existing model if it exists
mongoose.models = {};
mongoose.modelSchemas = {};

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
    category: {
        type: String,
        required: true,
        enum: ['Technology', 'Lifestyle', 'Travel', 'Other']
    },
    image: {
        type: String,
        default: ''
    },
    // Make sure author is optional
    author: {
        type: String,
        required: false,
        default: 'Admin'
    },
    published: {
        type: Boolean,
        default: true
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
    timestamps: true,
    versionKey: false
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

// Clear any existing model and create a new one
if (mongoose.models.Post) {
    delete mongoose.models.Post;
}

module.exports = mongoose.model('Post', postSchema); 