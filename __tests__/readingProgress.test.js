const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const Club = require('../models/Club');
const Book = require('../models/Book');
const ReadingProgress = require('../models/ReadingProgress');

let testUser, testUser2, adminUser;
let userToken, userToken2;
let testClub, testBook, testBook2;
let progressId;

// Variables to hold test data, defined in beforeAll
let initialProgressData;
let updatedProgressData;

// Helper function for user registration and login
const registerAndLogin = async (username, email, password) => {
    await request(app).post('/users/register').send({ username, email, password, displayName: username });
    const loginResponse = await request(app).post('/users/login').send({ email, password });
    return { user: loginResponse.body.user, token: loginResponse.body.token };
};

// Setup
beforeAll(async () => { 
    // FIX: Increase timeout for beforeAll hook to allow time for the memory DB connection and setup
    console.log(`Mongoose connected to isolated in-memory DB: ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);

    // Setup Users
    const auth1 = await registerAndLogin('TestProgressUser', 'progress@test.com', 'password123');
    testUser = auth1.user;
    userToken = auth1.token;

    const auth2 = await registerAndLogin('OtherUser', 'other@test.com', 'password123');
    testUser2 = auth2.user;
    userToken2 = auth2.token;

    // Setup Book
    const bookResponse = await Book.create({ title: 'Test Progress Book', author: 'Author Name', isbn: '1234567890123' });
    testBook = bookResponse;

    const bookResponse2 = await Book.create({ title: 'Test Progress Book 2', author: 'Author Name 2', isbn: '1234567890124' });
    testBook2 = bookResponse2;

    // Setup Club
    const clubResponse = await Club.create({ 
        name: 'Test Progress Club', 
        description: 'Club for testing progress', 
        creator: testUser._id 
    });
    testClub = clubResponse;
    
    // FIX 2: Define data payload AFTER all IDs are initialized
    initialProgressData = {
        clubId: testClub._id.toString(), // CRITICAL: Now using IDs initialized above
        bookId: testBook._id.toString(), // CRITICAL: Now using IDs initialized above
        percentage: 50,
        currentPage: 100,
        notes: "Starting to read."
    };
    
    updatedProgressData = {
        clubId: testClub._id.toString(), // CRITICAL: Now using IDs initialized above
        bookId: testBook._id.toString(), // CRITICAL: Now using IDs initialized above
        percentage: 75,
        currentPage: 150,
        notes: "Almost finished."
    };
}, 15000); 

// Teardown
afterAll(async () => {
    await mongoose.connection.close();
    console.log("Isolated DB connection closed and server stopped.");
});

describe('READING PROGRESS CRUD/Upsert Endpoints', () => {

    // Test 1: POST /progress (Create - Successful creation)
    test('POST /progress should create a new progress entry (201)', async () => {
        const response = await request(app)
            .post('/progress')
            .set('Authorization', `Bearer ${userToken}`)
            .send(initialProgressData);

        if (response.statusCode !== 201) {
            console.error('POST /progress Failed with response body:', response.body);
        }

        expect(response.statusCode).toBe(201);
        // Robust capture of the ID
        const createdProgress = response.body.progress || response.body;
        expect(createdProgress).toHaveProperty('_id');
        expect(createdProgress.percentage).toBe(50);
        progressId = createdProgress._id; // Capture ID for subsequent tests
    });

    // Test 2: GET /progress/:id (Read - Successful retrieval by owner)
    test('GET /progress/:id should retrieve the created progress entry for the owner (200)', async () => {
        if (!progressId) throw new Error("progressId is undefined, POST test failed to capture ID.");

        const response = await request(app)
            .get(`/progress/${progressId}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body._id).toBe(progressId.toString());
        expect(response.body.percentage).toBe(50);
        expect(response.body.user._id).toBe(testUser._id.toString());
    });

    // Test 3: POST /progress (Update - Successful update/upsert)
    test('POST /progress should update the existing progress entry for the book (200)', async () => {
        const response = await request(app)
            .post('/progress')
            .set('Authorization', `Bearer ${userToken}`)
            .send(updatedProgressData);

        expect(response.statusCode).toBe(200);
        const result = response.body.updatedProgress || response.body;
        expect(result.percentage).toBe(75);
        // The ID should be the same as the one initially created
        expect(result._id).toBe(progressId.toString());
    });
    
    // Test 4: GET /progress/:id (Read - Forbidden access for other users)
    test('GET /progress/:id should return 403 Forbidden for another user', async () => {
        if (!progressId) throw new Error("progressId is undefined, POST test failed to capture ID.");

        const response = await request(app)
            .get(`/progress/${progressId}`)
            .set('Authorization', `Bearer ${userToken2}`); // Using token of a different user

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('Forbidden');
    });

    // Test 5: DELETE /progress/:id (Delete - Successful deletion)
    test('DELETE /progress/:id should allow the user to delete their progress entry (200) and verify 404', async () => {
        if (!progressId) throw new Error("progressId is undefined, POST test failed to capture ID.");

        const deleteResponse = await request(app)
            .delete(`/progress/${progressId}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(deleteResponse.statusCode).toBe(200);
        expect(deleteResponse.body.message).toBe('Reading progress deleted successfully');

        // Verification: GET should now return 404 Not Found
        const verifyResponse = await request(app)
            .get(`/progress/${progressId}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(verifyResponse.statusCode).toBe(404);
    });

    // Test 6: GET All Progress by Club
    test('GET /progress/club/:clubId should retrieve all progress entries for a club (200)', async () => {
        // Setup two new progress entries for the club
        const newProgress1 = await ReadingProgress.create({
            user: testUser._id,
            book: testBook._id,
            club: testClub._id,
            percentage: 10,
        });

        const newProgress2 = await ReadingProgress.create({
            user: testUser2._id,
            book: testBook2._id,
            club: testClub._id,
            percentage: 90,
        });

        const response = await request(app)
            .get(`/progress/club/${testClub._id.toString()}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(2);
        
        // Check sorting: highest percentage first
        expect(response.body[0].percentage).toBe(90);
        expect(response.body[1].percentage).toBe(10);
        
        // Clean up
        await ReadingProgress.deleteMany({ club: testClub._id });
    });
});