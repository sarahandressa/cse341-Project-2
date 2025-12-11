// routes/auth.js

const express = require('express');
const passport = require('passport');
const router = express.Router(); 
const User = require('../models/User'); 
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 

// ----------------------------------------------------
// POST /register
// Creates a new user with password hashing. Accepts optional 'isAdmin' and 'displayName'.
// ----------------------------------------------------
router.post('/register', async (req, res) => {
    // Include all expected fields, 'isAdmin' is optional
    const { email, password, username, displayName, isAdmin } = req.body; 

    // Basic validation for required fields
    if (!email || !password || !username) {
        return res.status(400).json({ message: 'Missing required fields: email, password, and username.' });
    }

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists.' }); 
        }

        // 1. Password Hashing (CRUCIAL)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 2. Create New User Object
        const newUser = {
            email, 
            password: hashedPassword, 
            username, 
            displayName: displayName || username, // Use username if displayName is missing
            isAdmin: isAdmin || false // Set isAdmin based on input, defaults to false
        };

        user = new User(newUser); 
        await user.save();

        // Log the user in immediately after registration
        req.login(user, (err) => {
            if (err) return res.status(500).json({ message: 'Error logging in after registration.' });
            
            // Return success response with isAdmin status
            res.status(201).json({ 
                message: 'User registered and logged in successfully.',
                userId: user._id,
                isAdmin: user.isAdmin
            });
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// ----------------------------------------------------
// GET /login (Information/Status Route)
// ----------------------------------------------------
router.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        return res.json({ message: 'You are already logged in.', userId: req.user._id });
    }
    res.status(200).json({ 
        message: 'Send a POST request to this endpoint with email and password in the body to log in.', 
        endpoint: 'POST /login' // Corrected endpoint without /auth
    });
});


// ----------------------------------------------------
// POST /login (Local Login with JWT)
// ----------------------------------------------------
router.post('/login', (req, res, next) => {
    // Use a custom callback to control the JWT response and handle invalid credentials
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            // Server-side error during authentication check
            return res.status(500).json({ message: 'Authentication failed due to server error.' });
        }
        if (!user) {
            // Invalid email or password (Passport returns done(null, false) here)
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        
        // --- JWT SUCCESS LOGIC ---
        const token = jwt.sign(
            { id: user._id, isAdmin: user.isAdmin }, // Include isAdmin in the token payload
            process.env.JWT_SECRET || 'your-secret-key', 
            { expiresIn: '1d' }
        );
        
        // Establish an Express session for any session-based routes (like Swagger UI cookieAuth)
        req.login(user, { session: true }, (err) => {
             if (err) console.warn("Could not establish session after JWT login:", err.message);
        });

        return res.status(200).json({
            message: 'Local Login successful.',
            token: token, 
            userId: user._id,
            isAdmin: user.isAdmin
        });

    })(req, res, next);
});


// ----------------------------------------------------
// EXISTING: Github Routes 
// ----------------------------------------------------
router.get('/login/github', passport.authenticate('github'));

router.get(
    '/github/callback',
    passport.authenticate('github', { failureRedirect: '/' }),
    (req, res) => {
        // Successful GitHub login redirects the user
        res.redirect('/api-docs?message=GitHub%20Login%20Success');
    }
);


router.get('/logout', (req, res, next) => {
    // req.logout is asynchronous in newer Passport versions
    req.logout(function (err) {
        if (err) return next(err);

        // Destroy the session and clear the cookie
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return next(err);
            }

            res.clearCookie('connect.sid', { path: '/' });

            // Redirect the user to a public page
            res.redirect('/?message=Successfully logged out');
        });
    });
});

module.exports = router;