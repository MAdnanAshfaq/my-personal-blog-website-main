class AdminPanel {
    constructor() {
        // Bind methods to preserve 'this' context
        this.handlePostSubmit = this.handlePostSubmit.bind(this);
        this.showModal = this.showModal.bind(this);
        this.hideModal = this.hideModal.bind(this);
        this.addPostToList = this.addPostToList.bind(this);
        this.removePostFromList = this.removePostFromList.bind(this);
        this.editPost = this.editPost.bind(this);
        this.deletePost = this.deletePost.bind(this);

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        if (!this.checkAuth()) {
            window.location.href = './login.html';
            return;
        }

        this.socket = io('http://localhost:5000', {
            withCredentials: true,
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            auth: {
                token: this.getToken()
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        this.socket.on('connect', () => {
            console.log('Socket connected successfully');
        });

        this.tags = new Set();
        this.setupSocketListeners();
        this.setupEventListeners();
        this.loadPosts();
        this.initializeTinyMCE();
    }

    checkAuth() {
        const token = this.getToken();
        if (!token) return false;

        // Check if token is expired
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp * 1000 < Date.now()) {
                localStorage.removeItem('adminToken');
                return false;
            }
            return true;
        } catch (e) {
            console.error('Token validation error:', e);
            localStorage.removeItem('adminToken');
            return false;
        }
    }

    getToken() {
        const token = localStorage.getItem('adminToken');
        console.log('Retrieved token:', token); // Debug log
        return token; // Token already includes 'Bearer ' prefix
    }

    initializeTinyMCE() {
        try {
            tinymce.init({
                selector: '#content',
                plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
                toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                height: 500,
                setup: (editor) => {
                    // Store editor instance
                    this.editor = editor;
                    
                    editor.on('init', () => {
                        console.log('TinyMCE initialized');
                    });
                },
                init_instance_callback: (editor) => {
                    console.log('Editor instance ready');
                }
            }).then(() => {
                console.log('TinyMCE loaded successfully');
            }).catch(err => {
                console.error('TinyMCE initialization error:', err);
            });
        } catch (error) {
            console.error('Error initializing TinyMCE:', error);
        }
    }

    setupSocketListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
        });

        this.socket.on('postCreated', (post) => {
            console.log('New post created:', post);
            this.addPostToList(post);
        });

        this.socket.on('postUpdated', (post) => {
            console.log('Post updated:', post);
            this.updatePostInList(post);
        });

        this.socket.on('postDeleted', (postId) => {
            console.log('Post deleted:', postId);
            this.removePostFromList(postId);
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.showNotification('Connection error', 'error');
        });
    }

    setupEventListeners() {
        const newPostBtn = document.getElementById('newPostBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const postForm = document.getElementById('postForm');
        const cancelBtn = document.getElementById('cancelBtn');

        if (!newPostBtn || !logoutBtn || !postForm || !cancelBtn) {
            console.error('Required DOM elements not found');
            return;
        }

        newPostBtn.addEventListener('click', this.showModal);
        logoutBtn.addEventListener('click', () => this.logout());
        postForm.addEventListener('submit', this.handlePostSubmit);
        cancelBtn.addEventListener('click', this.hideModal);

        document.getElementById('tagInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTag(e.target.value);
                e.target.value = '';
            }
        });

        document.getElementById('featuredImage').addEventListener('change', (e) => {
            this.handleImagePreview(e);
        });
    }

    async loadPosts() {
        try {
            const response = await this.fetchWithAuth('http://localhost:5000/api/admin/posts');
            if (!response.ok) throw new Error('Failed to load posts');
            const posts = await response.json();
            this.renderPosts(posts);
        } catch (error) {
            console.error('Error loading posts:', error);
            this.showNotification('Failed to load posts', 'error');
        }
    }

    renderPosts(posts) {
        const postsList = document.querySelector('.posts-list');
        if (!postsList) return;

        postsList.innerHTML = '';
        posts.forEach(post => this.addPostToList(post));
    }

    addPostToList(post) {
        const postsList = document.querySelector('.posts-list');
        if (!postsList) {
            console.error('Posts list container not found');
            return;
        }

        const postElement = document.createElement('div');
        postElement.className = 'post-item';
        postElement.dataset.postId = post._id;

        postElement.innerHTML = `
            <div class="post-header">
                <h3>${this.escapeHtml(post.title)}</h3>
                <div class="post-meta">
                    <span class="category">${this.escapeHtml(post.category)}</span>
                    <span class="date">${new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="post-actions">
                <button class="btn-edit">Edit</button>
                <button class="btn-delete">Delete</button>
            </div>
        `;

        // Add event listeners after creating the element
        const editBtn = postElement.querySelector('.btn-edit');
        const deleteBtn = postElement.querySelector('.btn-delete');

        editBtn.addEventListener('click', () => this.editPost(post._id));
        deleteBtn.addEventListener('click', () => this.deletePost(post._id));

        postsList.insertBefore(postElement, postsList.firstChild);
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async handlePostSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const isEditing = form.dataset.isEditing === 'true';
        const postId = form.dataset.postId;
        
        try {
            const tagsInput = formData.get('tags');
            const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

            let content = '';
            if (this.editor && this.editor.getContent) {
                content = this.editor.getContent();
            } else {
                content = formData.get('content') || '';
            }

            const postData = {
                title: formData.get('title'),
                content: content,
                category: formData.get('category'),
                tags: tags,
                imageUrl: formData.get('imageUrl') || '',
                author: 'Admin'
            };

            const url = isEditing 
                ? `http://localhost:5000/api/admin/posts/${postId}`
                : 'http://localhost:5000/api/admin/posts';

            const method = isEditing ? 'PUT' : 'POST';

            const response = await this.fetchWithAuth(url, {
                method: method,
                body: JSON.stringify(postData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `Failed to ${isEditing ? 'update' : 'create'} post`);
            }

            const post = await response.json();
            this.hideModal();
            
            if (isEditing) {
                // Update existing post in the list
                const postElement = document.querySelector(`[data-post-id="${postId}"]`);
                if (postElement) {
                    postElement.remove();
                }
            }
            
            this.addPostToList(post);
            form.reset();
            form.dataset.isEditing = 'false';
            form.dataset.postId = '';
            
            if (this.editor && this.editor.setContent) {
                this.editor.setContent('');
            }
            
            this.showNotification(`Post ${isEditing ? 'updated' : 'created'} successfully!`, 'success');
        } catch (error) {
            console.error(`Error ${isEditing ? 'updating' : 'creating'} post:`, error);
            this.showNotification(error.message || `Failed to ${isEditing ? 'update' : 'create'} post`, 'error');
        }
    }

    async handleImagePreview(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }

    addTag(tag) {
        tag = tag.trim();
        if (!tag || this.tags.has(tag)) return;

        this.tags.add(tag);
        this.renderTags();
    }

    removeTag(tag) {
        this.tags.delete(tag);
        this.renderTags();
    }

    renderTags() {
        const tagsList = document.getElementById('tagsList');
        tagsList.innerHTML = Array.from(this.tags).map(tag => `
            <div class="tag-item">
                ${tag}
                <button onclick="adminPanel.removeTag('${tag}')">&times;</button>
            </div>
        `).join('');
    }

    // Helper methods
    showModal() {
        const modal = document.getElementById('postModal');
        if (modal) {
            modal.style.display = 'block';
            // Reset form and editor
            const form = document.getElementById('postForm');
            if (form) form.reset();
            if (this.editor && this.editor.setContent) {
                this.editor.setContent('');
            }
        }
    }

    hideModal() {
        const modal = document.getElementById('postModal');
        if (modal) {
            modal.style.display = 'none';
            // Reset form and editor
            const form = document.getElementById('postForm');
            if (form) form.reset();
            if (this.editor && this.editor.setContent) {
                this.editor.setContent('');
            }
        }
    }

    showLoading() {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = '<div class="loading-spinner"></div>';
        document.body.appendChild(overlay);
    }

    hideLoading() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) overlay.remove();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());

        // Add new notification
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Add a logout method
    logout() {
        localStorage.removeItem('adminToken');
        window.location.href = './login.html';
    }

    // Add method to make authenticated requests
    async fetchWithAuth(url, options = {}) {
        const token = this.getToken();
        console.log('Token from storage:', token); // Debug log

        if (!token) {
            throw new Error('No authentication token found');
        }

        const defaultOptions = {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        // Log the full request details
        console.log('Request URL:', url);
        console.log('Request options:', JSON.stringify(mergedOptions, null, 2));

        const response = await fetch(url, mergedOptions);

        // Log response status
        console.log('Response status:', response.status);

        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = './login.html?auth=failed';
            throw new Error('Authentication failed');
        }

        return response;
    }

    // Update deletePost method if you have one
    async deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const response = await this.fetchWithAuth(`http://localhost:5000/api/admin/posts/${postId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete post');

            // Remove post from DOM
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            if (postElement) {
                postElement.remove();
                this.showNotification('Post deleted successfully', 'success');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            this.showNotification('Failed to delete post', 'error');
        }
    }

    async editPost(postId) {
        try {
            const response = await this.fetchWithAuth(`http://localhost:5000/api/admin/posts/${postId}`);
            if (!response.ok) throw new Error('Failed to fetch post');
            
            const post = await response.json();
            
            // Fill the form with post data
            document.getElementById('title').value = post.title;
            document.getElementById('category').value = post.category;
            if (this.editor && this.editor.setContent) {
                this.editor.setContent(post.content);
            }
            document.getElementById('tags').value = post.tags.join(', ');
            document.getElementById('imageUrl').value = post.imageUrl || '';

            // Store the post ID for updating
            const form = document.getElementById('postForm');
            if (form) {
                form.dataset.postId = postId;
                form.dataset.isEditing = 'true';
            }
            
            this.showModal();
        } catch (error) {
            console.error('Error editing post:', error);
            this.showNotification('Failed to load post for editing', 'error');
        }
    }

    removePostFromList(postId) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            postElement.remove();
        }
    }

    updatePostInList(post) {
        // Remove old version if it exists
        this.removePostFromList(post._id);
        // Add updated version
        this.addPostToList(post);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});

// Add notification styles to your CSS
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    }

    .notification.success {
        background-color: #10B981;
    }

    .notification.error {
        background-color: #EF4444;
    }

    .notification.info {
        background-color: #3B82F6;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style); 