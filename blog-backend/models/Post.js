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

// Add image fetching middleware
postSchema.pre('save', async function(next) {
    if (!this.image) {
        try {
            // Extract keywords from title and content
            const keywords = this.title.split(' ').concat(this.category);
            const searchQuery = encodeURIComponent(keywords.join(' '));

            const response = await fetch(
                `https://api.unsplash.com/search/photos?query=${searchQuery}&client_id=TyT6CsZ_x-c7LatIP59Hi0GNx4VsVMIKp6fGjCnoNqA`
            );
            
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                // Get a random image from the first 5 results
                const randomIndex = Math.floor(Math.random() * Math.min(5, data.results.length));
                this.image = data.results[randomIndex].urls.regular;
            }
        } catch (error) {
            console.error('Error fetching image from Unsplash:', error);
            // Set a default image if fetch fails
            this.image = 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=800';
        }
    }
    next();
});

// Clear any existing model and create a new one
if (mongoose.models.Post) {
    delete mongoose.models.Post;
}

module.exports = mongoose.model('Post', postSchema); 