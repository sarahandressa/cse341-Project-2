
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ----------------------------------
// 1. REGISTER USER (POST /users/register)
// ----------------------------------
exports.register = async (req, res) => {
    //Check if the user provided all necessary information
    if (!req.body.username || !req.body.email || !req.body.password) {
        return res.status(400).json({ message: 'Please provide username, email, and password.' });
    }

    try {

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        
        //Create the new user object
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            passwordHash: hashedPassword
           
        });

        //Save the user to the database
        await user.save();

       
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        // Handle unique constraint errors (e.g., username or email already exists)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Username or email already exists.' });
        }
        console.error("Registration error:", error);
        res.status(500).json({ error: 'Registration failed due to an internal error.' });
    }
};

// ----------------------------------
// 2. LOGIN USER (POST /users/login)
// ----------------------------------
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        //Find the user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Authentication failed: User not found.' });
        }

        //Compare the provided password with the stored hash
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Authentication failed: Incorrect password.' });
        }

        
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key', 
            { expiresIn: '1h' } 
        );

        
        res.cookie('jwt', token, {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            maxAge: 3600000 
        });
        
        
        res.status(200).json({ message: 'Logged in successfully', username: user.username });
        
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: 'Login failed due to an internal error.' });
    }
};

// ----------------------------------
// 3. LOGOUT USER (GET /users/logout)
// ----------------------------------
exports.logout = (req, res) => {
    

    
    res.cookie('jwt', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(0) 
    });

    
    res.status(200).json({ message: 'Logged out successfully.' });
};