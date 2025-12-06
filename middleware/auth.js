
function ensureAuthenticated(req, res, next) {
    
    if (req.isAuthenticated()) {
        
        return next(); 
    }
    
    
    console.error('Access Denied: User not authenticated.');
    res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'You need to be logged in to perform this action (Use /login).' 
    });
}

module.exports = { ensureAuthenticated };