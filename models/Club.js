const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    genre: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
    schedule: { type: String, enum: ["Weekly", "Biweekly", "Monthly"], required: true },
    membersLimit: { type: Number, min: 1, required: true },
    isActive: { type: Boolean, default: true }
}, { 
    collection: 'clubs',
    // 🚨 FIX: Disable command buffering to prevent 10s Mongoose timeouts during tests
    bufferCommands: false,
});


module.exports = mongoose.model('Club', ClubSchema);