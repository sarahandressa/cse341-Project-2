const express = require('express');
const { body, param, validationResult, check } = require('express-validator');
const router = express.Router();
const readingProgressController = require('../controllers/readingProgressController');
const { isAuthenticated } = require('../middleware/authenticate');

/* ------------------------ VALIDATION ------------------------ */
const checkValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
};

const progressValidators = [
    body('book').isMongoId().withMessage('Book ID is required and must be valid.'),
    body('club').isMongoId().withMessage('Club ID is required and must be valid.'),
    check('percentage')
        .isFloat({ min: 0, max: 100 })
        .withMessage('Percentage must be a number between 0 and 100.'),
    body('currentPage')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Current Page must be a non-negative integer.'),
    checkValidation,
];

// --- API Endpoints (Documentation now handled by swagger/paths.yaml) ---

// GET ALL PROGRESS BY CLUB (READ)
router.get('/club/:clubId', param('clubId').isMongoId().withMessage('Invalid Club ID'), checkValidation, readingProgressController.getAllProgressByClub);

// GET PROGRESS BY COMPOUND KEY (User/Book/Club)
router.get('/user/:userId/book/:bookId/club/:clubId', 
    param('userId').isMongoId().withMessage('Invalid User ID'),
    param('bookId').isMongoId().withMessage('Invalid Book ID'),
    param('clubId').isMongoId().withMessage('Invalid Club ID'),
    checkValidation, 
    readingProgressController.getProgressByKeys
);

// GET SINGLE PROGRESS BY ID (READ)
router.get('/:id', param('id').isMongoId().withMessage('Invalid Progress ID'), checkValidation, readingProgressController.getProgressById);

// POST PROGRESS (CREATE/UPDATE - UPSERT) - PROTECTED
router.post('/', isAuthenticated, progressValidators, readingProgressController.createOrUpdateProgress);

// DELETE PROGRESS (DELETE) - PROTECTED
router.delete('/:id', isAuthenticated, param('id').isMongoId().withMessage('Invalid Progress ID'), checkValidation, readingProgressController.deleteProgress);

module.exports = router;