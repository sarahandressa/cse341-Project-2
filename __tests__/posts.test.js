// __tests__/posts.test.js
// This file tests the CRUD endpoints for Posts and Comments

const request = require('supertest');
const getApp = require('../server'); 
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server'); // NEW IMPORT

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
    let res = await request(app).post('/auth/register').send(userA);
    userA._id = res.body.userId;
    res = await request(app).post('/auth/register').send(userB);
    userB._id = res.body.userId;

    // 5. LOGIN USERS and GET TOKEN
    res = await request(app).post('/auth/login').send({ email: userA.email, password: userA.password });
    tokenA = res.body.token;
    
    res = await request(app).post('/auth/login').send({ email: userB.email, password: userB.password });
    tokenB = res.body.token;

    // 6. SEED INITIAL DATA (Club)
    const mockClub = await Club.create({ 
        name: 'Test Post Club', 
        owner: userA._id,
        description: 'A club for testing post functionality.',
        genre: 'Sci-Fi', 
        schedule: 'Monthly', 
        membersLimit: 100 
    });
    clubId = mockClub._id;
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
// POSTS CRUD Endpoints Tests (REST OF THE FILE REMAINS THE SAME)
// ----------------------------------------------------

describe('POSTS CRUD Endpoints', () => {
    
    test('POST /posts should allow authenticated user (B) to create a new post (201)', async () => {
        const newPost = {
            club: clubId.toString(), 
            title: "Test Post by User B",
            content: "This is the content of the first test post.",
        };

        const response = await request(app)
            .post('/posts')
            .set('Authorization', `Bearer ${tokenB}`) 
            .send(newPost);

        expect(response.statusCode).toBe(201);
        
        const createdPost = response.body.post || response.body; 
        expect(createdPost).toHaveProperty('author');
        expect(createdPost).toHaveProperty('club');
        
        postId = createdPost._id; 
    });

    test('GET /posts/:id should retrieve the created post (200)', async () => {
        if (!postId) throw new Error("postId is undefined, POST test failed to capture ID.");

        const response = await request(app)
            .get(`/posts/${postId}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(response.statusCode).toBe(200);
        
        const retrievedPost = response.body; 
        
        expect(retrievedPost).not.toBeUndefined();
        expect(retrievedPost).toHaveProperty('title');
        expect(retrievedPost.title).toBe("Test Post by User B");
    });
    
    test('PUT /posts/:id should allow the post author (User B) to update the post (200)', async () => {
        if (!postId) throw new Error("postId is undefined, POST test failed to capture ID.");

        const updatedContent = {
            content: "Updated content for the first test post.",
        };

        const response = await request(app)
            .put(`/posts/${postId}`)
            .set('Authorization', `Bearer ${tokenB}`)
            .send(updatedContent);

        expect(response.statusCode).toBe(200);
        
        const updatedPost = response.body.post || response.body.updatedPost || response.body;
        expect(updatedPost.content).toBe(updatedContent.content);
    });

    test('DELETE /posts/:id should allow the post author (User B) to delete the post (200)', async () => {
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

    test('POST /posts should return 401 if unauthenticated', async () => {
        const response = await request(app)
            .post('/posts')
            .send({});

        expect(response.statusCode).toBe(401);
    });
});