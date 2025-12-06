
function isAuthenticated(req, res, next) {
    
    if (req.isAuthenticated()) {
        
        return next(); 
    }
    
    
    console.error('Access Denied: User not authenticated for resource.');
    res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Acesso negado. Você precisa fazer login com o GitHub para completar esta ação.' 
    });
}


module.exports = { isAuthenticated };