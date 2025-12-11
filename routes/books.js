const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const booksController = require('../controllers/booksController');
const { isAuthenticated } = require('../middleware/authenticate');

/* ------------------------ VALIDATION ------------------------ */
const checkValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
};

const bookValidators = [
    body('title').notEmpty().withMessage('Title is required.'),
    body('author').notEmpty().withMessage('Author is required.'),
    body('publishedMonth').isIn(["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]).withMessage('Invalid month.'),
    body('publishedYear').isInt({ min: 1500, max: 2100 }).withMessage('Invalid year.'),
    checkValidation,
];

// --- API Endpoints (Documentation now handled by swagger/paths.yaml) ---

// GET ALL BOOKS (READ)
router.get('/', booksController.getAllBooks);

// GET SINGLE BOOK (READ)
router.get('/:id', param('id').isMongoId().withMessage('Invalid Book ID'), checkValidation, booksController.getBookById);

// POST BOOK (CREATE) - PROTECTED
router.post('/', isAuthenticated, bookValidators, booksController.createBook);

// PUT BOOK (UPDATE) - PROTECTED
router.put('/:id', isAuthenticated, param('id').isMongoId().withMessage('Invalid Book ID'), bookValidators, booksController.updateBook);

// DELETE BOOK (DELETE) - PROTECTED
router.delete('/:id', isAuthenticated, param('id').isMongoId().withMessage('Invalid Book ID'), checkValidation, booksController.deleteBook);

module.exports = router;