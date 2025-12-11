
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/authenticate'); 

// ------------------------------------------
// Public Routes 
// ------------------------------------------

router.post('/register', authController.register);


router.post('/login', authController.login);

// ------------------------------------------
// Protected Routes (Authentication required)
// ------------------------------------------

router.get('/logout', authController.logout);


router.get('/profile', isAuthenticated, (req, res) => {
    
    res.status(200).json({ 
        message: 'Successfully retrieved profile data.', 
        user: req.user 
    });
});


module.exports = router;