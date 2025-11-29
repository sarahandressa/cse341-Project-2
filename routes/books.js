const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const booksController = require('../controllers/booksController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Book:
 *       type: object
 *       required:
 *         - title
 *         - author
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated id
 *         title:
 *           type: string
 *           description: Book title
 *         author:
 *           type: string
 *           description: Book author
 *         pages:
 *           type: integer
 *           description: Number of pages
 *         summary:
 *           type: string
 *           description: Short summary
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *       example:
 *         _id: "656d3a2f4b1c2d3e4f5a6789"
 *         title: "My First Book"
 *         author: "Jane Doe"
 *         pages: 123
 *         summary: "A short test book"
 *         createdAt: "2025-11-29T18:35:00.000Z"
 */

/**
 * @swagger
 * tags:
 *   - name: Books
 *     description: Book management
 */

/* Helper to check validation */
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn('Validation errors:', JSON.stringify(errors.array(), null, 2));
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Get list of all books
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: Array of books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 */
router.get('/', booksController.getAll);

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: Get a book by id
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB id of the book
 *     responses:
 *       200:
 *         description: Book found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: Book not found
 */
router.get('/:id',
  param('id').isMongoId().withMessage('Invalid ID'),
  checkValidation,
  booksController.getById
);

/**
 * @swagger
 * /books:
 *   post:
 *     summary: Create a new book
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       201:
 *         description: Book created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         description: Validation error
 */
router.post('/',
  body('title').trim().notEmpty().withMessage('title is required'),
  body('author').trim().notEmpty().withMessage('author is required'),
  body('pages').optional().isInt({ min: 1 }).withMessage('pages must be an integer >= 1'),
  body('summary').optional().isString(),
  checkValidation,
  booksController.create
);

/**
 * @swagger
 * /books/{id}:
 *   put:
 *     summary: Update a book by id
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB id of the book to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               pages:
 *                 type: integer
 *               summary:
 *                 type: string
 *     responses:
 *       200:
 *         description: Book updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Book not found
 */
router.put('/:id',
  param('id').isMongoId().withMessage('Invalid ID'),
  body('title').optional().trim().notEmpty(),
  body('author').optional().trim().notEmpty(),
  body('pages').optional().isInt({ min: 1 }),
  body('summary').optional().isString(),
  checkValidation,
  booksController.update
);

/**
 * @swagger
 * /books/{id}:
 *   delete:
 *     summary: Delete a book by id
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB id of the book to delete
 *     responses:
 *       200:
 *         description: Book deleted
 *       404:
 *         description: Book not found
 */
router.delete('/:id',
  param('id').isMongoId().withMessage('Invalid ID'),
  checkValidation,
  booksController.remove
);

module.exports = router;
