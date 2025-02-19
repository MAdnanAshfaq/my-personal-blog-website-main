const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from current directory
app.use(express.static(__dirname));

// Serve index.html for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve login.html
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.listen(port, () => {
    console.log(`Admin panel running at http://localhost:${port}`);
}); 