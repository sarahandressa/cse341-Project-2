// config/db.js

const mongoose = require('mongoose');

async function connectDB(uri) {
    // If running tests, the connection is already managed by tests/setup.js
    if (process.env.NODE_ENV === 'test') {
        return; 
    }
    
    // --- Production/Development Connection Logic ---
    try {
        // 🚨 FIX: Removed obsolete options: useNewUrlParser and useUnifiedTopology
        await mongoose.connect(uri, {
            // Add any other standard connection options if needed
        });
        console.log('MongoDB connected.');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }
    }
}

module.exports = connectDB;