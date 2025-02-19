class AdminPanel {
    constructor() {
        // Remove automatic binding
        this.init();
        this.attachEventListeners();
        // Remove the navigation warning
        window.onbeforeunload = null;
        this.currentPostId = null; // Track which post is being edited
    }

    init() {
        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found in admin.js, redirecting to login');
            window.location.replace('login.html');
            return;
        }
        console.log('Token found in admin.js, initializing admin panel');
        
        // Clear any query parameters from the URL without refreshing
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Initialize the admin panel
        this.loadPosts();
    }

    attachEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // New post button
        const newPostBtn = document.getElementById('newPostBtn');
        if (newPostBtn) {
            newPostBtn.addEventListener('click', () => this.handleNewPost());
        }

        // Handle form submission
        const postForm = document.getElementById('postForm');
        if (postForm) {
            postForm.addEventListener('submit', (e) => this.handleSubmitPost(e));
        }

        // Handle cancel button
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hidePostForm();
            });
        }
    }

    hidePostForm() {
        const formSection = document.getElementById('postFormSection');
        if (formSection) {
            formSection.style.display = 'none';
        }
        // Reset form
        const form = document.getElementById('postForm');
        if (form) {
            form.reset();
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Submit';
        }
        this.currentPostId = null;
    }

    async handleSubmitPost(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const postData = {
            title: formData.get('title'),
            content: formData.get('content'),
            category: formData.get('category'),
            image: formData.get('image') || ''
        };
        
        try {
            console.log('Sending post data:', postData); // Debug log

            const token = localStorage.getItem('token');
            const url = this.currentPostId 
                ? `http://localhost:5000/api/admin/posts/${this.currentPostId}`
                : 'http://localhost:5000/api/admin/posts';
                
            const method = this.currentPostId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });

            const responseData = await response.json();
            console.log('Response:', responseData); // Debug log

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to save post');
            }

            // Reset form and UI
            form.reset();
            this.currentPostId = null;
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Submit';
            
            // Hide form and reload posts
            this.hidePostForm();
            this.loadPosts();
            
            alert(method === 'PUT' ? 'Post updated successfully' : 'Post created successfully');

        } catch (error) {
            console.error('Error saving post:', error);
            alert('Failed to save post: ' + error.message);
        }
    }

    async loadPosts() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/admin/posts', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load posts');
            }

            const posts = await response.json();
            this.displayPosts(posts);
        } catch (error) {
            console.error('Error loading posts:', error);
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

    handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.replace('login.html');
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
            const response = await fetch(`http://localhost:5000/api/admin/posts/${postId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch post');

            const post = await response.json();
            
            // Show form and fill with post data
            const formSection = document.getElementById('postFormSection');
            formSection.style.display = 'block';
            
            // Fill form with post data
            document.getElementById('title').value = post.title;
            document.getElementById('category').value = post.category;
            document.getElementById('content').value = post.content;
            document.getElementById('image').value = post.image || '';

            // Store the current post ID
            this.currentPostId = postId;
            
            // Change form submit button text
            const submitBtn = document.querySelector('#postForm button[type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Update Post';

        } catch (error) {
            console.error('Error editing post:', error);
            alert('Failed to edit post: ' + error.message);
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
document.addEventListener('DOMContentLoaded', () => {
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