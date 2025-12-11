// tests/setup.js
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const path = require('path');

let mongod;

// Use dotenv to load environment variables for testing (if needed, e.g., secret keys)
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

module.exports = async () => {
    // 1. Start the MongoDB in-memory server
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // Store the URI globally so our tests can access it
    global.__MONGO_URI__ = uri;
    global.__MONGOD__ = mongod;

    try {
        // 2. Connect Mongoose to the in-memory server
        // Mongoose automatically uses new connection options now
        await mongoose.connect(uri);

        console.log('Jest Global Setup: MongoMemoryServer started and Mongoose connected (Ready).');
        
        // Ensure the connection is fully established before returning
        await mongoose.connection.asPromise(); 

    } catch (error) {
        console.error('Mongoose connection failed during setup:', error);
        // If connection fails, stop the server and throw the error
        await mongod.stop();
        throw error;
    }
    
    // 3. Registering Mongoose models (Optional, but often helps load them early)
    // Make sure your models are imported here if needed globally
    // Example: require('../models/User');
};