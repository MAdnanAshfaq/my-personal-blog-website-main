class LoginHandler {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.setupLoginForm();
    }

    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            console.log('Attempting login with:', { username });

            const response = await fetch(`${this.apiBaseUrl}/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });

            console.log('Login response status:', response.status);
            const data = await response.json();
            console.log('Login response data:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            if (!data.token) {
                throw new Error('No token received from server');
            }

            // Store the token
            localStorage.setItem('token', data.token);
            console.log('Token stored successfully');

            // Since login was successful, redirect directly
            window.location.href = '/admin/index.html';

        } catch (error) {
            console.error('Login error:', error);
            this.showError(`Login failed: ${error.message}`);
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = message;
        }
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    new LoginHandler();
});

// Debug: Check if the script is loaded
console.log('Login.js loaded'); 