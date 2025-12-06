
function isAuthenticated(req, res, next) {
    
    if (req.isAuthenticated()) {
        
        return next(); 
    }
    
    
    console.error('Access Denied: User not authenticated for resource.');
    res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Access denied. You need to log in with GitHub to complete this action.' 
    });
}


module.exports = { isAuthenticated };