// tests/teardown.js

const mongoose = require('mongoose');

/**
 * Global teardown function.
 * Ensures Mongoose connection is closed and MongoMemoryServer is stopped.
 */
module.exports = async () => {
    try {
        // 1. Force close Mongoose connection
        await mongoose.connection.close();
        
        // 2. Stop the in-memory MongoDB server
        if (global.__MONGO_SERVER__) {
            await global.__MONGO_SERVER__.stop();
        }

        // 3. Clean up global references
        delete global.__MONGO_SERVER__;
        delete global.__MONGO_URI__;

        console.log('Jest Global Teardown: Mongoose disconnected and MongoMemoryServer stopped.');
    } catch (err) {
        // Log errors, but don't fail the teardown
        console.error('Error during Jest Global Teardown:', err.message);
    }
};