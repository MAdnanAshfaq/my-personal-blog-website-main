class BlogManager {
    constructor() {
        this.blogContainer = document.querySelector('.blog-card-group');
        this.categoryContainer = document.querySelector('.category-buttons');
        if (!this.blogContainer) {
            console.error('Blog container not found');
            return;
        }
        this.searchInput = document.querySelector('#searchInput');
        this.API_URL = 'http://localhost:5000/api';
        
        this.initializeBlog();
        this.setupEventListeners();
    }

    async initializeBlog() {
        try {
            await Promise.all([
                this.loadPosts(),
                this.loadCategories()
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
            const response = await fetch('http://localhost:5000/api/search/categories', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const categories = await response.json();
            this.renderCategories(categories);
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    renderCategories(categories) {
        if (!this.categoryContainer) return;

        const categoryButtons = categories.map(category => `
            <button class="category-btn" data-category="${this.escapeHtml(category)}">
                ${this.escapeHtml(category)}
            </button>
        `).join('');

        this.categoryContainer.innerHTML = `
            <button class="category-btn active" data-category="all">All</button>
            ${categoryButtons}
        `;

        // Add event listeners to category buttons
        this.categoryContainer.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => this.filterByCategory(btn.dataset.category));
        });
    }

    async filterByCategory(category) {
        try {
            const response = await fetch(`http://localhost:5000/api/public/posts${category === 'all' ? '' : `?category=${category}`}`);
            if (!response.ok) throw new Error('Failed to fetch filtered posts');
            
            const posts = await response.json();
            this.renderPosts(posts);

            // Update active category button
            this.categoryContainer.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.category === category);
            });
        } catch (error) {
            console.error('Error filtering posts:', error);
            this.showErrorMessage();
        }
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
            const response = await fetch('http://localhost:5000/api/public/posts', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const posts = await response.json();
            if (posts.length > 0) {
                this.renderPosts(posts);
            } else {
                this.showNoPostsMessage();
            }
        } catch (error) {
            console.error('Error loading posts:', error);
            this.showErrorMessage();
        }
    }

    renderPosts(posts) {
        if (!this.blogContainer) {
            console.error('Blog container not found');
            return;
        }

        // Clear existing content
        this.blogContainer.innerHTML = '';

        // Sort posts by publishedAt date in descending order
        const sortedPosts = posts.sort((a, b) => 
            new Date(b.publishedAt) - new Date(a.publishedAt)
        );

        const postsHTML = sortedPosts.map(post => `
            <div class="blog-card">
                <div class="blog-card-banner">
                    <img src="${post.imageUrl || './assets/images/blog-1.png'}" 
                         alt="${this.escapeHtml(post.title)}" 
                         width="250" 
                         class="blog-banner-img"
                         onerror="this.src='./assets/images/blog-1.png'">
                </div>

                <div class="blog-content-wrapper">
                    <button class="blog-topic text-tiny">${this.escapeHtml(post.category)}</button>

                    <h3>
                        <a href="#" class="h3">
                            ${this.escapeHtml(post.title)}
                        </a>
                    </h3>

                    <p class="blog-text">
                        ${this.stripHtmlAndTruncate(post.content, 150)}
                    </p>

                    <div class="wrapper-flex">
                        <div class="profile-wrapper">
                            <img src="./assets/images/author.png" 
                                 alt="${this.escapeHtml(post.author)}" 
                                 width="50">
                        </div>

                        <div class="wrapper">
                            <a href="#" class="h4">${this.escapeHtml(post.author)}</a>
                            <p class="text-sm">
                                <time datetime="${post.publishedAt}">
                                    ${this.formatDate(post.publishedAt)}
                                </time>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        this.blogContainer.innerHTML = postsHTML;
    }

    showNoPostsMessage() {
        if (this.blogContainer) {
            this.blogContainer.innerHTML = `
                <div class="no-posts">
                    <p>No published posts available yet.</p>
                </div>
            `;
        }
    }

    showErrorMessage() {
        if (this.blogContainer) {
            this.blogContainer.innerHTML = `
                <div class="error-message">
                    <p>Failed to load posts. Please try again later.</p>
                </div>
            `;
        }
    }

    setupRealTimeUpdates() {
        // Poll for updates every 30 seconds
        setInterval(() => this.loadPosts(), 30000);
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    stripHtmlAndTruncate(html, length) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        const text = tmp.textContent || tmp.innerText || '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a short moment to ensure all elements are available
    setTimeout(() => {
        new BlogManager();
    }, 100);
}); 