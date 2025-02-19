class AdminPanel {
    constructor() {
        // Check authentication first
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
        this.initializeTinyMCE();
        this.loadPosts();
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
        tinymce.init({
            selector: '#content',
            plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
            toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
            height: 500,
            referrerPolicy: "origin",
            relative_urls: false,
            remove_script_host: false,
            convert_urls: true,
            image_uploadtab: true,
            automatic_uploads: true,
            hidden_input: false,
            images_upload_handler: async (blobInfo, progress) => {
                try {
                    const formData = new FormData();
                    formData.append('image', blobInfo.blob());
                    
                    const response = await fetch('http://localhost:5000/api/admin/upload', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.getToken()}`
                        },
                        body: formData
                    });

                    if (!response.ok) throw new Error('Upload failed');
                    
                    const data = await response.json();
                    return data.url;
                } catch (error) {
                    console.error('Image upload failed:', error);
                    throw error;
                }
            },
            setup: (editor) => {
                editor.on('init', () => {
                    console.log('TinyMCE initialized successfully');
                });
                editor.on('change', () => {
                    editor.save();
                });
            }
        });
    }

    setupSocketListeners() {
        this.socket.on('newPost', (post) => {
            this.addPostToList(post);
        });

        this.socket.on('updatePost', (post) => {
            this.updatePostInList(post);
        });

        this.socket.on('deletePost', (postId) => {
            this.removePostFromList(postId);
        });
    }

    setupEventListeners() {
        document.getElementById('newPostBtn')?.addEventListener('click', () => {
            this.showModal();
        });

        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });

        document.getElementById('postForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const content = tinymce.get('content').getContent();
            document.getElementById('content').value = content;
            this.handlePostSubmit(e);
        });

        document.getElementById('cancelBtn')?.addEventListener('click', () => {
            this.hideModal();
        });

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
            this.showNotification(error.message, 'error');
        }
    }

    renderPosts(posts) {
        const postsList = document.querySelector('.posts-list');
        postsList.innerHTML = posts.map(post => this.createPostCard(post)).join('');
    }

    createPostCard(post) {
        return `
            <div class="post-card" data-id="${post._id}">
                <h3>${post.title}</h3>
                <p>${post.content.substring(0, 150)}...</p>
                <div class="post-actions">
                    <button onclick="adminPanel.editPost('${post._id}')">Edit</button>
                    <button onclick="adminPanel.deletePost('${post._id}')">Delete</button>
                </div>
            </div>
        `;
    }

    async handlePostSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        try {
            const tagsInput = formData.get('tags');
            const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

            const response = await this.fetchWithAuth('http://localhost:5000/api/admin/posts', {
                method: 'POST',
                body: JSON.stringify({
                    title: formData.get('title'),
                    content: formData.get('content'),
                    tags: tags,
                    imageUrl: formData.get('imageUrl') || '',
                    author: 'Admin'
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create post');
            }

            const post = await response.json();
            this.hideModal();
            this.addPostToList(post);
            form.reset();
            tinymce.get('content').setContent('');
            this.showNotification('Post created successfully!', 'success');
        } catch (error) {
            console.error('Error creating post:', error);
            this.showNotification(error.message || 'Failed to create post', 'error');
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
        document.getElementById('postModal').style.display = 'block';
        document.getElementById('postForm').reset();
        if (tinymce.get('content')) {
            tinymce.get('content').setContent('');
        }
    }

    hideModal() {
        document.getElementById('postModal').style.display = 'none';
        document.getElementById('postForm').reset();
        if (tinymce.get('content')) {
            tinymce.get('content').setContent('');
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
        // Add notification element if it doesn't exist
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            document.body.appendChild(notification);
        }

        // Set notification content and style
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';

        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.style.display = 'none';
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
        try {
            const response = await this.fetchWithAuth(`http://localhost:5000/api/admin/posts/${postId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete post');
            
            // Remove post from DOM
            document.querySelector(`[data-post-id="${postId}"]`)?.remove();
            this.showNotification('Post deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting post:', error);
            this.showNotification(error.message, 'error');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
}); 