const mongoose = require('mongoose');

// --- IMPORTANT: ADJUST THIS SCHEMA TO MATCH YOUR DATABASE STRUCTURE ---
const UserSchema = new mongoose.Schema({
    // Fields for Local Strategy Login
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    
    // Common fields for Local and GitHub
    username: {
        type: String,
        required: true,
        unique: true,
    },
    
    // Optional: Fields specific to GitHub OAuth
    githubId: {
        type: String,
    },
    // -------------------------------------------------------------------
}, {
    // 🚨 FIX: Disable command buffering to prevent 10s Mongoose timeouts during tests
    bufferCommands: false, 
});

module.exports = mongoose.model('User', UserSchema);