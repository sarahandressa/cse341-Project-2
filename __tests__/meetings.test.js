// __tests__/meetings.test.js
// This file tests the CRUD endpoints for Meetings

const request = require('supertest');
const getApp = require('../server'); 
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server'); 

// Import Models
const User = require('../models/User'); 
const Club = require('../models/Club');
const Meeting = require('../models/Meeting'); 

// Global Test Variables
let app; 
let userA = { email: 'meetinguserA@test.com', password: 'password123', username: 'MeetingUserA' };
let userB = { email: 'meetinguserB@test.com', password: 'password123', username: 'MeetingUserB' };
let clubId, meetingId, tokenA, tokenB;
const testBookId = new mongoose.Types.ObjectId().toString(); 
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

    // 6. SEED INITIAL DATA (Club owned by User A)
    const mockClub = await Club.create({ 
        name: 'Test Meeting Club', 
        owner: userA._id,
        description: 'A club for testing meeting functionality.',
        genre: 'History', 
        schedule: 'Weekly', // Keep as valid enum
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
    await Meeting.deleteMany({ club: clubId });
    
    // 2. Close Mongoose connection
    await mongoose.connection.close();
    
    // 3. Stop MongoMemoryServer instance
    if (mongod) {
        await mongod.stop();
    }
    console.log("Isolated DB connection closed and server stopped.");
}, 90000); // Increased Jest timeout for setup/teardown

// ----------------------------------------------------
// MEETINGS CRUD Endpoints Tests 
// ----------------------------------------------------

describe('MEETINGS CRUD Endpoints', () => {
    
    // Test 1: POST /meetings (Creation)
    test('POST /meetings should allow club owner (User A) to create a new meeting (201)', async () => {
        // We use 'agenda' in the request, which the backend may map to 'topic'
        const newMeeting = {
            clubId: clubId, 
            agenda: "First Meeting Test Topic", 
            dateTime: new Date(Date.now() + 86400000).toISOString(), 
            location: "Virtual Room 1",
            book: testBookId, 
        };

        const response = await request(app)
            .post('/meetings')
            .set('Authorization', `Bearer ${tokenA}`) 
            .send(newMeeting);

        if (response.statusCode !== 201) {
             console.error('POST /meetings Failed with response body:', response.body);
        }

        expect(response.statusCode).toBe(201);
        const createdMeeting = response.body.meeting || response.body;
        expect(createdMeeting).toHaveProperty('_id');
        // FIX: Ensuring we check for the correct field, expecting 'topic' as per previous analysis
        expect(createdMeeting.topic).toBe(newMeeting.agenda); 
        
        meetingId = createdMeeting._id; 
    });

    // Test 2: GET /meetings/:id (Read)
    test('GET /meetings/:id should retrieve the created meeting (200)', async () => {
        // Guard clause in case previous test failed to capture ID
        if (!meetingId) throw new Error("meetingId is undefined, POST test failed to capture ID.");
        
        const response = await request(app)
            .get(`/meetings/${meetingId}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(response.statusCode).toBe(200);
        const retrievedMeeting = response.body.meeting || response.body;
        // Check for 'topic' (or 'agenda') depending on the response structure
        expect(retrievedMeeting.topic || retrievedMeeting.agenda).toBe("First Meeting Test Topic");
    });
    
    // Test 3: PUT /meetings/:id (Update)
    test('PUT /meetings/:id should allow the owner to update the meeting (200)', async () => {
        // Guard clause
        if (!meetingId) throw new Error("meetingId is undefined, POST test failed to capture ID.");

        const updatedMeeting = {
            // FIX: Added 'topic' back to prevent 400 (Bad Request) if it's a required field for update
            topic: "First Meeting Test Topic", 
            location: "Physical Location B",
        };

        const response = await request(app)
            .put(`/meetings/${meetingId}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send(updatedMeeting);

        expect(response.statusCode).toBe(200);

        const updatedResult = response.body.meeting || response.body.updatedMeeting || response.body;
        expect(updatedResult.location).toBe(updatedMeeting.location);
    });

    // Test 4: DELETE /meetings/:id (Delete)
    test('DELETE /meetings/:id should allow the owner to delete the meeting (200)', async () => {
        // Guard clause
        if (!meetingId) throw new Error("meetingId is undefined, POST test failed to capture ID.");

        const response = await request(app)
            .delete(`/meetings/${meetingId}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Meeting deleted successfully');

        // Verify deletion
        const verifyResponse = await request(app)
            .get(`/meetings/${meetingId}`)
            .set('Authorization', `Bearer ${tokenA}`);
        
        expect(verifyResponse.statusCode).toBe(404);
    });

    // Test 5: POST /meetings (Unauthenticated)
    test('POST /meetings should return 401 if unauthenticated', async () => {
        const response = await request(app)
            .post('/meetings')
            .send({});

        expect(response.statusCode).toBe(401);
    });
});