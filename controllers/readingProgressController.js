// controllers/readingProgressController.js

const ReadingProgress = require('../models/ReadingProgress');
const mongoose = require('mongoose');

// ----------------------------------
// READ Operations (GET)
// ----------------------------------

/**
 * Gets a specific user's reading progress for a book in a club (GET /progress/user/:userId/book/:bookId/club/:clubId)
 */
exports.getProgressByKeys = async (req, res) => {
    try {
        const { userId, bookId, clubId } = req.params;

        
        const progress = await ReadingProgress.findOne({
            user: userId,
            book: bookId,
            club: clubId
        })
        .populate('user', 'username displayName')
        .populate('book', 'title author')
        .populate('club', 'name');

        if (!progress) {
            return res.status(200).json({ message: 'No progress found for this combination.', progress: null });
        }

        res.status(200).json(progress);
    } catch (error) {
        
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Bad Request', message: 'Invalid ID format in URL.' });
        }
        res.status(500).json({ error: 'Server Error', message: 'Could not retrieve reading progress.' });
    }
};

/**
 * Gets a single reading progress entry by its ID. (GET /progress/:id)
 */
exports.getProgressById = async (req, res) => {
    try {
        
        // --- CRITICAL FIX: Prevent 500 TypeError if authentication middleware fails ---
        if (!req.user || !req.user.id) {
            console.error("Error in getProgressById: req.user is undefined or missing ID.");
            return res.status(403).json({ error: 'Authorization Error', message: 'User ID not found in token payload.' });
        }
        const authenticatedUserId = req.user.id;
        // --------------------------------------------------------------------------

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Bad Request', message: 'Invalid ID format.' });
        }

        // Find the progress entry
        const progress = await ReadingProgress.findById(req.params.id)
            .populate('user', 'username displayName')
            .populate('book', 'title author');
        
        if (!progress) return res.status(404).json({ error: 'Not Found', message: 'Reading Progress entry not found' });
        
        // Authorization check: Ensure the user is the owner
        if (progress.user._id.toString() !== authenticatedUserId) {
            return res.status(403).json({ error: 'Forbidden', message: 'Access denied. You can only view your own progress.' });
        }
        
        res.status(200).json(progress);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Bad Request', message: 'Invalid ID format.' });
        }
        // Note: The original error (TypeError) is now handled by the critical fix above.
        console.error("Error in getProgressById:", error); 
        res.status(500).json({ error: 'Server Error', message: 'Could not retrieve reading progress entry.' });
    }
};

/**
 * Gets all reading progress entries for a specific club. (GET /progress/club/:clubId)
 */
exports.getAllProgressByClub = async (req, res) => {
    try {
        const { clubId } = req.params;

        // Mongoose uses 'club' field to filter by the clubId from the URL
        const progressList = await ReadingProgress.find({ club: clubId })
            .populate('user', 'username displayName')
            .populate('book', 'title author')
            .populate('club', 'name')
            .sort({ percentage: -1 }); 

        res.status(200).json(progressList);
    } catch (error) {
        
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Bad Request', message: 'Invalid Club ID format.' });
        }
        res.status(500).json({ error: 'Server Error', message: 'Could not retrieve club progress list.' });
    }
};


// ----------------------------------
// CREATE/UPDATE Operation (POST - Upsert)
// ----------------------------------

/**
 * Creates a new progress entry or updates an existing one (Upsert). (POST /progress) 
 * MAPPED FIX: Translates clubId -> club and bookId -> book.
 */
exports.createOrUpdateProgress = async (req, res) => {
    try {
        // --- DATA MAPPING: Renames fields to match Mongoose Schema ---
        const { 
            clubId: club,      // clubId from request body maps to 'club' for Mongoose
            bookId: book,      // bookId from request body maps to 'book' for Mongoose
            percentage, 
            currentPage, 
            notes 
        } = req.body;
        
        // ID from the authenticated user
        const user = req.user.id; 

        // 1. Check if the progress entry already exists
        // The query now uses the Mongoose schema names (user, book, club)
        const query = { user, book, club };
        const existingProgress = await ReadingProgress.findOne(query);

        // Determine the correct status code based on existence
        const statusCode = existingProgress ? 200 : 201;

        // 2. Prepare the update data and options
        const update = { 
            percentage, 
            currentPage, 
            notes, 
            updatedAt: Date.now() 
        };
        
        const options = { 
            upsert: true, 
            new: true, 
            setDefaultsOnInsert: true, 
            runValidators: true 
        };

        // 3. Perform the Upsert operation
        const progress = await ReadingProgress.findOneAndUpdate(query, update, options)
            .populate('user', 'username displayName')
            .populate('book', 'title author');

        // 4. Send the response with the determined status code
        res.status(statusCode).json(progress); 

    } catch (error) {
        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({ error: 'Validation Failed', message: 'Failed to record progress: ' + error.message });
        }
        res.status(500).json({ error: 'Server Error', message: 'Could not record progress.' });
    }
};

// ----------------------------------
// DELETE Operation (DELETE)
// ----------------------------------

/**
 * Deletes a reading progress entry by its ID. (DELETE /progress/:id) 
 */
exports.deleteProgress = async (req, res) => {
    try {
        // Find the progress entry first to perform authorization check
        const progress = await ReadingProgress.findById(req.params.id);

        if (!progress) {
            return res.status(404).json({ error: 'Not Found', message: 'Reading Progress entry not found.' });
        }

        // Authorization check: Ensure the user is the owner
        if (progress.user.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden', message: 'You can only delete your own progress records.' });
        }

        // Proceed with deletion
        await ReadingProgress.deleteOne({ _id: req.params.id });
        
        res.status(200).json({ message: 'Reading progress deleted successfully' });
    } catch (error) {
           if (error.name === 'CastError') {
               return res.status(400).json({ error: 'Bad Request', message: 'Invalid ID format.' });
           }
        res.status(500).json({ error: 'Server Error', message: 'Could not delete progress.' });
    }
};