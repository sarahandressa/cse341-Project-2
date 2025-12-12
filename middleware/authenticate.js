

const jwt = require('jsonwebtoken');

const isAuthenticated = (req, res, next) => {
    const authHeader = req.header('Authorization');
    
    let token;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extract the token part: remove "Bearer " prefix
        token = authHeader.split(' ')[1]; 
    } else {
        // Fallback: Check for the token in cookies
        token = req.cookies.jwt; 
    }
    
    
    if (!token || token === 'undefined' || (typeof token === 'string' && token.toLowerCase() === 'undefined')) {
        console.error('Access Denied: No JWT token found in header or cookies.');
        return res.status(401).json({ 
            error: 'Unauthorized', 
            message: 'Access denied. A valid login token is required.' 
        });
    }

    try {
        // Ensure you have JWT_SECRET defined in your .env file
        const secret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, secret);
        
        req.user = decoded; 
        next(); 
    } catch (err) {
        // Log the specific error message to help debug (e.g., 'jwt expired')
        console.error(`Access Denied: Invalid or expired token. Details: ${err.message}`); 
        return res.status(401).json({ 
            error: 'Unauthorized', 
            message: 'Access denied. Invalid or expired token.' 
        });
    }
};

module.exports = { isAuthenticated };