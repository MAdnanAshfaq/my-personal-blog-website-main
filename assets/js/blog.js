class BlogManager {
    constructor() {
        this.blogContainer = document.querySelector('.blog-container');
        this.searchInput = document.querySelector('#searchInput');
        this.categorySelect = document.querySelector('#categorySelect');
        this.API_URL = 'http://localhost:5000/api';
        
        this.initializeBlog();
        this.setupEventListeners();
    }

    async initializeBlog() {
        try {
            await Promise.all([
                this.loadPosts(),
                this.loadCategories(),
                this.setupRealTimeUpdates()
            ]);
        } catch (error) {
            console.error('Failed to initialize blog:', error);
        }
    }

    setupEventListeners() {
        // Search with debounce
        let searchTimeout;
        this.searchInput?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.handleSearch(e.target.value);
            }, 300);
        });

        // Category filter
        this.categorySelect?.addEventListener('change', (e) => {
            this.filterByCategory(e.target.value);
        });

        // Comment form submission
        document.addEventListener('submit', (e) => {
            if (e.target.matches('.comment-form')) {
                e.preventDefault();
                this.handleCommentSubmit(e.target);
            }
        });
    }

    async handleSearch(query) {
        try {
            const response = await fetch(`${this.API_URL}/search?q=${encodeURIComponent(query)}`);
            const posts = await response.json();
            this.renderPosts(posts);
        } catch (error) {
            console.error('Search failed:', error);
        }
    }

    async filterByCategory(category) {
        try {
            const response = await fetch(`${this.API_URL}/search?category=${encodeURIComponent(category)}`);
            const posts = await response.json();
            this.renderPosts(posts);
        } catch (error) {
            console.error('Category filter failed:', error);
        }
    }

    async handleCommentSubmit(form) {
        try {
            const postId = form.dataset.postId;
            const formData = new FormData(form);
            
            const response = await fetch(`${this.API_URL}/comments/post/${postId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.get('name'),
                    email: formData.get('email'),
                    content: formData.get('content')
                })
            });

            if (!response.ok) throw new Error('Failed to post comment');

            const comment = await response.json();
            this.addCommentToPost(postId, comment);
            form.reset();
        } catch (error) {
            console.error('Comment submission failed:', error);
        }
    }

    async loadCategories() {
        try {
            const response = await fetch(`${this.API_URL}/search/categories`);
            const categories = await response.json();
            this.renderCategories(categories);
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    renderCategories(categories) {
        if (!this.categorySelect) return;

        const options = categories.map(cat => `
            <option value="${cat._id}">${cat._id} (${cat.count})</option>
        `).join('');

        this.categorySelect.innerHTML = `
            <option value="">All Categories</option>
            ${options}
        `;
    }

    addCommentToPost(postId, comment) {
        const commentsList = document.querySelector(`#comments-${postId}`);
        if (!commentsList) return;

        const commentHtml = this.createCommentHTML(comment);
        commentsList.insertAdjacentHTML('afterbegin', commentHtml);
    }

    createCommentHTML(comment) {
        return `
            <div class="comment" data-comment-id="${comment._id}">
                <div class="comment-header">
                    <strong>${comment.author.name}</strong>
                    <span>${new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="comment-content">${comment.content}</div>
                <button class="reply-btn" onclick="blogManager.showReplyForm('${comment._id}')">
                    Reply
                </button>
                <div class="replies">
                    ${comment.replies.map(reply => `
                        <div class="reply">
                            <div class="reply-header">
                                <strong>${reply.author.name}</strong>
                                <span>${new Date(reply.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div class="reply-content">${reply.content}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    async loadPosts() {
        try {
            const response = await fetch(this.API_URL);
            if (!response.ok) throw new Error('Failed to fetch posts');
            
            const posts = await response.json();
            this.renderPosts(posts);
        } catch (error) {
            console.error('Error loading posts:', error);
            this.showError('Failed to load blog posts');
        }
    }

    renderPosts(posts) {
        if (!this.blogContainer) return;

        this.blogContainer.innerHTML = posts.map(post => `
            <article class="blog-card">
                ${post.imageUrl ? `
                    <div class="blog-banner-box">
                        <img src="${post.imageUrl}" alt="${post.title}" loading="lazy">
                    </div>
                ` : ''}

                <div class="blog-content">
                    <h3 class="h3">
                        ${post.title}
                    </h3>

                    <div class="blog-text">
                        ${post.content}
                    </div>

                    <div class="wrapper">
                        <div class="blog-publish-date">
                            <ion-icon name="calendar-outline"></ion-icon>
                            <time datetime="${new Date(post.createdAt).toISOString()}">
                                ${new Date(post.createdAt).toLocaleDateString()}
                            </time>
                        </div>

                        <div class="blog-author">
                            <ion-icon name="person-outline"></ion-icon>
                            <span>${post.author}</span>
                        </div>
                    </div>

                    <div class="blog-tags">
                        ${post.tags.map(tag => `
                            <span class="tag">${tag}</span>
                        `).join('')}
                    </div>
                </div>
            </article>
        `).join('');
    }

    showError(message) {
        if (!this.blogContainer) return;
        
        this.blogContainer.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
                <button onclick="blogManager.loadPosts()">Try Again</button>
            </div>
        `;
    }

    setupRealTimeUpdates() {
        // Poll for updates every 30 seconds
        setInterval(() => this.loadPosts(), 30000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.blogManager = new BlogManager();
}); 