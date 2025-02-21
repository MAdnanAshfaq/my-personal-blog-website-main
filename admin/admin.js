class AdminPanel {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.token = localStorage.getItem('token');
        this.init();
    }

    async init() {
        try {
            if (!this.token) {
                this.redirectToLogin();
                return;
            }

            await this.initializeAdmin();
            this.setupEventListeners();
            await this.loadPosts();
            
            // Show the "New Post" button
            const newPostBtn = document.getElementById('newPostBtn');
            if (newPostBtn) {
                newPostBtn.style.display = 'block';
            }
        } catch (error) {
            console.error('Initialization error:', error);
            if (error.message.includes('401')) {
                this.redirectToLogin();
            }
        }
    }

    redirectToLogin() {
        localStorage.removeItem('token');
        window.location.replace('/admin/login.html');
    }

    async initializeAdmin() {
        // Initialize TinyMCE
        await tinymce.init({
            selector: '#content',
            height: 500,
            plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                'preview', 'anchor', 'searchreplace', 'visualblocks', 'code',
                'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | blocks | bold italic backcolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | removeformat | help',
            setup: (editor) => {
                editor.on('change', () => {
                    editor.save(); // Sync TinyMCE content with textarea
                });
            }
        });
    }

    setupEventListeners() {
        // New Post button
        const newPostBtn = document.getElementById('newPostBtn');
        if (newPostBtn) {
            newPostBtn.addEventListener('click', () => this.showPostForm());
        }

        // Post form
        const postForm = document.getElementById('postForm');
        if (postForm) {
            postForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleSubmitPost(e);
            });
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hidePostForm());
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async handleLogout() {
        localStorage.removeItem('token');
        window.location.href = '/admin/login.html';
    }

    showPostForm() {
        const postForm = document.getElementById('postForm');
        const postsList = document.getElementById('postsList');
        if (postForm && postsList) {
            postForm.style.display = 'block';
            postsList.style.display = 'none';
            
            // Reset form and TinyMCE
            postForm.reset();
            if (tinymce.get('content')) {
                tinymce.get('content').setContent('');
            }
        }
    }

    hidePostForm() {
        const postForm = document.getElementById('postForm');
        const postsList = document.getElementById('postsList');
        if (postForm && postsList) {
            postForm.style.display = 'none';
            postsList.style.display = 'block';
        }
    }

    async handleSubmitPost(e) {
        e.preventDefault();
        
        try {
            const form = e.target;
            const title = form.querySelector('#title').value.trim();
            const category = form.querySelector('#category').value.trim();
            let content = tinymce.get('content').getContent().trim();
            const image = form.querySelector('#image').value.trim();

            if (!title || !category || !content) {
                throw new Error('Please fill in all required fields');
            }

            const postData = {
                title,
                content,
                category,
                image: image || '',
                published: true
            };

            const response = await fetch(`${this.apiBaseUrl}/admin/posts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Error creating post');
            }

            this.showNotification('Post created successfully!', 'success');
            form.reset();
            tinymce.get('content').setContent('');
            this.hidePostForm();
            await this.loadPosts();

        } catch (error) {
            console.error('Post submission error:', error);
            this.showNotification(error.message, 'error');
            if (error.message.includes('401')) {
                this.redirectToLogin();
            }
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '1000';
        
        if (type === 'error') {
            notification.style.backgroundColor = '#fee2e2';
            notification.style.color = '#dc2626';
        } else {
            notification.style.backgroundColor = '#dcfce7';
            notification.style.color = '#16a34a';
        }

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    async loadPosts() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/posts`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.redirectToLogin();
                    return;
                }
                throw new Error('Failed to load posts');
            }

            const posts = await response.json();
            this.displayPosts(posts);
        } catch (error) {
            console.error('Error loading posts:', error);
            if (error.message.includes('401')) {
                this.redirectToLogin();
            }
        }
    }

    displayPosts(posts) {
        const postsList = document.querySelector('.posts-list');
        if (!postsList) return;

        postsList.innerHTML = posts.length ? posts.map(post => `
            <div class="post-item" data-id="${post._id}">
                <div class="post-status ${post.published ? 'published' : 'draft'}">
                    ${post.published ? 'Published' : 'Draft'}
                </div>
                <h3>${this.escapeHtml(post.title)}</h3>
                <p>${this.escapeHtml(post.content.substring(0, 100))}...</p>
                <div class="post-actions">
                    <button onclick="adminPanel.editPost('${post._id}')" class="btn-edit">Edit</button>
                    <button onclick="adminPanel.togglePublish('${post._id}', ${!post.published})" 
                            class="btn-publish ${post.published ? 'unpublish' : 'publish'}">
                        ${post.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button onclick="adminPanel.deletePost('${post._id}')" class="btn-delete">Delete</button>
                </div>
            </div>
        `).join('') : '<p>No posts yet</p>';
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    handleNewPost() {
        const formSection = document.getElementById('postFormSection');
        if (formSection) {
            formSection.style.display = 'block';
        }
    }

    async editPost(postId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBaseUrl}/admin/posts/${postId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch post');
            }

            const post = await response.json();
            
            // Show the form
            const postForm = document.getElementById('postForm');
            postForm.style.display = 'block';
            
            // Fill the form with post data
            document.getElementById('title').value = post.title || '';
            document.getElementById('category').value = post.category || '';
            document.getElementById('image').value = post.image || '';
            
            // Set content in TinyMCE
            if (tinymce.get('content')) {
                tinymce.get('content').setContent(post.content || '');
            }

            // Store the post ID for updating
            postForm.dataset.postId = postId;
            
            // Change submit button text
            const submitBtn = postForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Update Post';
            }

            // Hide posts list
            document.getElementById('postsList').style.display = 'none';

        } catch (error) {
            console.error('Error editing post:', error);
            this.showNotification('Error loading post for editing', 'error');
        }
    }

    async deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to delete post');

            // Reload posts after successful deletion
            this.loadPosts();
            alert('Post deleted successfully');

        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post: ' + error.message);
        }
    }

    async togglePublish(postId, shouldPublish) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/posts/${postId}/publish`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ published: shouldPublish })
            });

            if (!response.ok) throw new Error('Failed to update publish status');

            // Reload posts to show updated status
            this.loadPosts();
            alert(shouldPublish ? 'Post published successfully' : 'Post unpublished');

        } catch (error) {
            console.error('Error updating publish status:', error);
            alert('Failed to update publish status: ' + error.message);
        }
    }
}

// Create a global instance of AdminPanel
let adminPanel;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    adminPanel = new AdminPanel();
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

// Initialize TinyMCE
function initTinyMCE() {
    tinymce.init({
        selector: '#content',
        height: 500,
        plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | ' +
            'bold italic backcolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
    });
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    initTinyMCE();
    const admin = new AdminPanel();
    admin.validateToken(); 
}); 