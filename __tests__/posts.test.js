// __tests__/posts.test.js
// This file tests the CRUD endpoints for Posts

const request = require('supertest');
const getApp = require('../server'); 
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server'); 

// Import Models
const User = require('../models/User'); 
const Club = require('../models/Club');
const Post = require('../models/Post'); 

// Global Test Variables
let app; 
let userA = { email: 'postuserA@test.com', password: 'password123', username: 'PostUserA' };
let userB = { email: 'postuserB@test.com', password: 'password123', username: 'PostUserB' };
let clubId, postId, tokenA, tokenB;
let mongod; // Instance of MongoMemoryServer

// ----------------------------------------------------
// SETUP HOOK: Init MongoMemoryServer, connect Mongoose, Register users, seed data
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
    
    // 4. REGISTER TEST USERS
    let res = await request(app).post('/register').send(userA);
    userA._id = res.body.userId;
    res = await request(app).post('/register').send(userB);
    userB._id = res.body.userId;

    // 5. LOGIN USERS and GET TOKEN
    res = await request(app).post('/login').send({ email: userA.email, password: userA.password });
    tokenA = res.body.token;
    
    res = await request(app).post('/login').send({ email: userB.email, password: userB.password });
    tokenB = res.body.token;

    // 6. SEED INITIAL DATA (Club)
    const mockClub = await Club.create({ 
        name: 'Test Post Club', 
        owner: userA._id,
        description: 'A club for testing post functionality.',
        genre: 'Sci-Fi', 
        // FIX: Changed 'Daily' to a valid enum value 'Weekly' to pass Mongoose Validation
        schedule: 'Weekly', 
        membersLimit: 50 
    });
    clubId = mockClub._id.toString();
}, 90000); // Increased Jest timeout for setup/teardown

// ----------------------------------------------------
// TEARDOWN HOOK: Clean up the database and close connections
// ----------------------------------------------------
afterAll(async () => {
    // 1. Cleanup data
    await User.deleteMany({ email: { $in: [userA.email, userB.email] } });
    await Club.findByIdAndDelete(clubId);
    await Post.deleteMany({ club: clubId });
    
    // 2. Close Mongoose connection
    await mongoose.connection.close();
    
    // 3. Stop MongoMemoryServer instance
    if (mongod) {
        await mongod.stop();
    }
    console.log("Isolated DB connection closed and server stopped.");
}, 90000); // Increased Jest timeout for setup/teardown

// ----------------------------------------------------
// POSTS CRUD Endpoints Tests 
// ----------------------------------------------------

describe('POSTS CRUD Endpoints', () => {
    
    // Test 1: POST /posts (Creation)
    test('POST /posts should allow authenticated user (User B) to create a new post (201)', async () => {
        // Ensure tokenB is defined before use 
        if (!tokenB) throw new Error("Authentication token B is missing, setup failed.");

        const newPost = {
            club: clubId, 
            title: 'First Post Test', 
            content: 'This is the initial content for the test post.',
        };

        const response = await request(app)
            .post('/posts')
            .set('Authorization', `Bearer ${tokenB}`) 
            .send(newPost);

        expect(response.statusCode).toBe(201);
        
        const createdPost = response.body.post || response.body; 

        expect(createdPost).toHaveProperty('_id');
        expect(createdPost.title).toBe(newPost.title);
        
        postId = createdPost._id; 
    });

    // Test 2: GET /posts/:id (Read)
    test('GET /posts/:id should retrieve the created post (200)', async () => {
        // Guard clause in case previous test failed to capture ID
        if (!postId) throw new Error("postId is undefined, POST test failed to capture ID.");
        
        const response = await request(app)
            .get(`/posts/${postId}`)
            .set('Authorization', `Bearer ${tokenA}`); // User A can read the post

        expect(response.statusCode).toBe(200);
        const retrievedPost = response.body.post || response.body;
        expect(retrievedPost.title).toBe("First Post Test");
    });
    
    // Test 3: PUT /posts/:id (Update)
    test('PUT /posts/:id should allow the post author (User B) to update the post (200)', async () => {
        // Guard clause
        if (!postId) throw new Error("postId is undefined, POST test failed to capture ID.");

        const updatedContent = {
            content: 'This is the updated content of the post.',
            // FIX: Ensure 'title' is always included in the update payload to satisfy validation
            title: 'Updated Test Post Title' 
        };

        const response = await request(app)
            .put(`/posts/${postId}`)
            .set('Authorization', `Bearer ${tokenB}`) // Only author B can update
            .send(updatedContent);

        expect(response.statusCode).toBe(200);

        const updatedPost = response.body.post || response.body.updatedPost || response.body;
        expect(updatedPost.content).toBe(updatedContent.content);
        expect(updatedPost.title).toBe(updatedContent.title);
    });

    // Test 4: DELETE /posts/:id (Delete)
    test('DELETE /posts/:id should allow the post author (User B) to delete the post (200)', async () => {
        // Guard clause
        if (!postId) throw new Error("postId is undefined, POST test failed to capture ID.");

        const response = await request(app)
            .delete(`/posts/${postId}`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Post deleted successfully');

        // Verify deletion
        const verifyResponse = await request(app)
            .get(`/posts/${postId}`)
            .set('Authorization', `Bearer ${tokenA}`);
        
        expect(verifyResponse.statusCode).toBe(404);
    });

    // Test 5: POST /posts (Unauthenticated)
    test('POST /posts should return 401 if unauthenticated', async () => {
        const response = await request(app)
            .post('/posts')
            .send({});

        expect(response.statusCode).toBe(401);
    });
});