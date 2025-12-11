// models/ReadingProgress.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReadingProgressSchema = new Schema({
    // Who is reading
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Which book they are tracking
    book: {
        type: Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    // Which club this progress is related to
    club: {
        type: Schema.Types.ObjectId,
        ref: 'Club',
        required: false 
    },
    // The current progress percentage (e.g., 50 for 50%)
    percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 0
    },
    // Last page number read (if tracking by pages)
    currentPage: {
        type: Number,
        min: 0,
        default: 0
    },
    // Notes or thoughts from the reader
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true // Adds 'createdAt' and 'updatedAt'
});


ReadingProgressSchema.index({ user: 1, book: 1, club: 1 }, { unique: true });

module.exports = mongoose.model('ReadingProgress', ReadingProgressSchema);