class LoginManager {
    constructor() {
        this.form = document.getElementById('loginForm');
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleLogin(e));
        }
        console.log('LoginManager initialized');
    }

    async handleLogin(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        console.log('Credentials:', { username, password });

        try {
            const response = await fetch('http://localhost:5000/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            console.log('Response received:', response.status);
            
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                console.log('Login successful');
                // Store the token
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Use the full URL path for redirect
                window.location.href = 'http://localhost:5000/admin/index.html';
                return false; // Prevent any further form submission
            } else {
                throw new Error(data.message || 'Login failed');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed: ' + error.message);
        }
        return false; // Prevent form submission
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});

// Debug: Check if the script is loaded
console.log('Login.js loaded'); 