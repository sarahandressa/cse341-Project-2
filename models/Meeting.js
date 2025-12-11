// models/Meeting.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const MeetingSchema = new Schema({
    // Link to the Club (The meeting belongs to this house/club)
    club: {
        type: Schema.Types.ObjectId,
        ref: 'Club',
        required: true
    },
    // The topic of the meeting (e.g., "Discussion of Chapter 5")
    topic: {
        type: String,
        required: true,
        trim: true
    },
    // Who is in charge of organizing the meeting
    organizer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // When the meeting is scheduled
    dateTime: {
        type: Date,
        required: true
    },
    // Where the meeting will take place (e.g., "Zoom Link", "Discord Channel")
    location: {
        type: String,
        required: true,
        trim: true
    },
    // A list of users who confirmed they will attend
    attendees: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Status of the meeting (e.g., 'Scheduled', 'Canceled', 'Completed')
    status: {
        type: String,
        enum: ['Scheduled', 'Canceled', 'Completed'],
        default: 'Scheduled'
    }
}, {
    timestamps: true 
});

module.exports = mongoose.model('Meeting', MeetingSchema);