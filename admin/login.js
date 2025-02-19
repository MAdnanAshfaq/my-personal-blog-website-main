class LoginManager {
    constructor() {
        this.setupEventListeners();
        // Check if we were redirected due to auth failure
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('auth') === 'failed') {
            this.showError('Session expired. Please login again.');
        }
    }

    setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(e);
        });
    }

    async handleLogin(e) {
        const form = e.target;
        const formData = new FormData(form);
        const username = formData.get('username');
        const password = formData.get('password');

        // Add loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Logging in...';
        submitButton.disabled = true;

        try {
            console.log('Sending login request...'); // Debug log

            const response = await fetch('http://localhost:5000/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include' // Important for cookies
            });

            const data = await response.json();
            console.log('Login response:', data); // Debug log

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            if (!data.token) {
                throw new Error('No token received');
            }

            // Store the token
            const tokenWithBearer = `Bearer ${data.token}`;
            console.log('Storing token:', tokenWithBearer); // Debug log
            localStorage.setItem('adminToken', tokenWithBearer);

            // Test if token was stored
            console.log('Stored token:', localStorage.getItem('adminToken')); // Verify storage

            // Redirect to admin panel
            window.location.href = './index.html';
        } catch (error) {
            console.error('Login error:', error);
            this.showError(error.message || 'Login failed. Please check your credentials.');
        } finally {
            // Reset button state
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    }

    showError(message) {
        let errorDiv = document.querySelector('.login-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'login-error';
            document.querySelector('.login-form').insertBefore(
                errorDiv,
                document.querySelector('button')
            );
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
}); 