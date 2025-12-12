const express = require('express');
const { body, param, validationResult, check } = require('express-validator');
const router = express.Router();
const readingProgressController = require('../controllers/readingProgressController');
const { isAuthenticated } = require('../middleware/authenticate');

/* ------------------------ VALIDATION ------------------------ */
/**
 * Middleware to check for validation errors from express-validator
 */
const checkValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
};

/**
 * Validators for creating or updating reading progress (POST /progress)
 * Requires bookId, clubId, and percentage.
 */
const progressValidators = [
    // Expects 'bookId' and 'clubId' in the request body (req.body)
    body('bookId').isMongoId().withMessage('Book ID is required and must be valid.'),
    body('clubId').isMongoId().withMessage('Club ID is required and must be valid.'),
    check('percentage')
        .isFloat({ min: 0, max: 100 })
        .withMessage('Percentage must be a number between 0 and 100.'),
    body('currentPage')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Current Page must be a non-negative integer.'),
    checkValidation,
];

// --- API Endpoints ---

/**
 * GET ALL PROGRESS BY CLUB (READ)
 * Retrieves progress for all users associated with a specific club.
 */
router.get('/club/:clubId', 
    param('clubId').isMongoId().withMessage('Invalid Club ID'), 
    checkValidation, 
    readingProgressController.getAllProgressByClub
);

/**
 * GET PROGRESS BY COMPOUND KEY (User/Book/Club)
 * Retrieves a single progress entry using the unique combination of user, book, and club IDs.
 */
router.get('/user/:userId/book/:bookId/club/:clubId', 
    param('userId').isMongoId().withMessage('Invalid User ID'),
    param('bookId').isMongoId().withMessage('Invalid Book ID'),
    param('clubId').isMongoId().withMessage('Invalid Club ID'),
    checkValidation, 
    readingProgressController.getProgressByKeys
);

/**
 * GET SINGLE PROGRESS BY ID (READ) - PROTECTED
 * Retrieves a single progress entry by its unique MongoDB ID.
 */
router.get('/:id', 
    isAuthenticated,
    param('id').isMongoId().withMessage('Invalid Progress ID'), 
    checkValidation, 
    readingProgressController.getProgressById
);

/**
 * POST PROGRESS (CREATE/UPDATE - UPSERT) - PROTECTED
 * Creates a new progress entry or updates an existing one based on the user/book/club combination.
 */
router.post('/', 
    isAuthenticated, 
    progressValidators, 
    readingProgressController.createOrUpdateProgress
);

/**
 * DELETE PROGRESS (DELETE) - PROTECTED
 * Deletes a reading progress entry by its unique MongoDB ID.
 */
router.delete('/:id', 
    isAuthenticated, 
    param('id').isMongoId().withMessage('Invalid Progress ID'), 
    checkValidation, 
    readingProgressController.deleteProgress
);

module.exports = router;