// __tests__/readingProgress.test.js
// This file tests the CRUD/Upsert endpoints for ReadingProgress

const request = require('supertest');
const getApp = require('../server'); 
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server'); // NEW IMPORT

// Import Models 
const User = require('../models/User'); 
const Book = require('../models/Book'); 
const Club = require('../models/Club');
const ReadingProgress = require('../models/ReadingProgress'); 

// Global Test Variables
let app; 
let userA = { email: 'progressuserA@test.com', password: 'password123', username: 'ProgressUserA' };
let clubId, bookId, progressId, tokenA;
let mongod; // Instance of MongoMemoryServer

// ----------------------------------------------------
// SETUP HOOK: Init MongoMemoryServer, connect Mongoose, Register user, seed data
// ----------------------------------------------------
beforeAll(async () => {
    // 1. START ISOLATED MONGODB SERVER
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    // 2. CONNECT MOONGOSE TO ISOLATED SERVER
    await mongoose.connect(uri);
    console.log(`Mongoose connected to isolated in-memory DB: ${uri}`);

    // 3. Initialize the application
    app = getApp(); 

    // 4. REGISTER TEST USER
    let res = await request(app).post('/auth/register').send(userA);
    userA._id = res.body.userId;

    // 5. LOGIN USER and GET TOKEN
    res = await request(app).post('/auth/login').send({ email: userA.email, password: userA.password });
    tokenA = res.body.token;

    // 6. SEED INITIAL DATA (Book and Club)
    const mockBook = await Book.create({ 
        title: 'Test Progress Book', 
        author: 'Author P', 
        isbn: '1234567890123', 
        pages: 300,
        publishedYear: 2023, 
        publishedMonth: 'October' 
    });
    bookId = mockBook._id.toString();

    const mockClub = await Club.create({ 
        name: 'Test Progress Club', 
        owner: userA._id,
        description: 'A club for testing reading progress.',
        genre: 'Drama', 
        schedule: 'Monthly', 
        membersLimit: 20 
    });
    clubId = mockClub._id.toString();
}, 90000); // Increased Jest timeout for setup/teardown

// ----------------------------------------------------
// TEARDOWN HOOK: Clean up the database and close connections
// ----------------------------------------------------
afterAll(async () => {
    // 1. Cleanup data
    await User.deleteMany({ email: userA.email });
    await Book.findByIdAndDelete(bookId);
    await Club.findByIdAndDelete(clubId);
    await ReadingProgress.deleteMany({ user: userA._id }); 
    
    // 2. Close Mongoose connection
    await mongoose.connection.close();
    
    // 3. Stop MongoMemoryServer instance
    if (mongod) {
        await mongod.stop();
    }
    console.log("Isolated DB connection closed and server stopped.");
}, 90000); // Increased Jest timeout for setup/teardown

// ----------------------------------------------------
// READING PROGRESS CRUD/Upsert Endpoints Tests (REST OF THE FILE REMAINS THE SAME)
// ----------------------------------------------------

describe('READING PROGRESS CRUD/Upsert Endpoints', () => {
    
    // Test 1: POST /progress (Create - Upsert)
    test('POST /progress should create a new reading progress entry (201)', async () => {
        const newProgress = {
            book: bookId, 
            club: clubId, 
            percentage: 50.0,
            currentPage: 150,
            notes: "Halfway through the book."
        };

        const response = await request(app)
            .post('/progress')
            .set('Authorization', `Bearer ${tokenA}`) 
            .send(newProgress);

        expect(response.statusCode).toBe(201);
        
        const createdProgress = response.body.progress || response.body; 

        expect(createdProgress).toHaveProperty('_id');
        expect(createdProgress.percentage).toBe(50);
        
        // Check the user ID in the populated field
        expect(createdProgress.user._id.toString()).toBe(userA._id.toString());
        
        progressId = createdProgress._id; 
    });

    // Test 2: GET /progress/:id (Read)
    test('GET /progress/:id should retrieve the created progress entry (200)', async () => {
        if (!progressId) throw new Error("progressId is undefined, POST test failed to capture ID.");
        
        const response = await request(app)
            .get(`/progress/${progressId}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(response.statusCode).toBe(200);

        const retrievedProgress = response.body;
        expect(retrievedProgress.percentage).toBe(50);
        expect(retrievedProgress.currentPage).toBe(150);
        
        expect(retrievedProgress.user._id.toString()).toBe(userA._id.toString()); 
    });

    // Test 3: POST /progress (Update - Upsert)
    test('POST /progress should update the existing reading progress entry (200)', async () => {
        if (!progressId) throw new Error("progressId is undefined, POST test failed to capture ID.");

        const updatedProgress = {
            book: bookId, 
            club: clubId, 
            percentage: 75.0,
            currentPage: 225,
        };

        const response = await request(app)
            .post('/progress')
            .set('Authorization', `Bearer ${tokenA}`) 
            .send(updatedProgress);

        expect(response.statusCode).toBe(200);
        
        const updatedResult = response.body.progress || response.body;

        expect(updatedResult.percentage).toBe(75);
        expect(updatedResult.currentPage).toBe(225);
        expect(updatedResult._id.toString()).toBe(progressId.toString());
    });

    // Test 4: DELETE /progress/:id (Delete)
    test('DELETE /progress/:id should delete the reading progress entry (200)', async () => {
        if (!progressId) throw new Error("progressId is undefined, POST test failed to capture ID.");

        const response = await request(app)
            .delete(`/progress/${progressId}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Reading progress deleted successfully');

        // Verify deletion
        const verifyResponse = await request(app)
            .get(`/progress/${progressId}`)
            .set('Authorization', `Bearer ${tokenA}`);
        
        expect(verifyResponse.statusCode).toBe(404);
    });

    // Test 5: POST /progress (Unauthenticated)
    test('POST /progress should return 401 if unauthenticated', async () => {
        const response = await request(app)
            .post('/progress')
            .send({});

        expect(response.statusCode).toBe(401);
    });
});