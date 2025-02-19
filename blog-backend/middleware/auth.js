const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        // Log all headers for debugging
        console.log('All headers:', req.headers);
        console.log('Authorization header:', req.headers.authorization);

        if (!req.headers.authorization) {
            console.log('No authorization header found');
            return res.status(401).json({ message: 'No authorization header' });
        }

        // Log the authorization header parts
        const parts = req.headers.authorization.split(' ');
        console.log('Auth header parts:', parts);

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            console.log('Invalid authorization header format');
            return res.status(401).json({ message: 'Invalid authorization format' });
        }

        const token = parts[1];
        console.log('Extracted token:', token);

        if (!token) {
            console.log('No token found in authorization header');
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);

        req.userData = decoded;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            message: 'Authentication failed: ' + error.message
        });
    }
}; 