const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const booksController = require('../controllers/booksController');

/* Validation helper */
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

/* Common validators for POST/PUT */
const bookValidators = [
  body('title').trim().notEmpty().withMessage('title is required'),
  body('author').trim().notEmpty().withMessage('author is required'),
  body('pages').isInt({ min: 1 }).withMessage('pages must be integer >= 1'),
  body('summary').trim().notEmpty().withMessage('summary is required'),
  checkValidation
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Book:
 *       type: object
 *       required:
 *         - title
 *         - author
 *         - pages
 *         - summary
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated id
 *         title:
 *           type: string
 *         author:
 *           type: string
 *         pages:
 *           type: integer
 *         summary:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
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
 *           example:
 *             title: "My First Book"
 *             author: "Jane Doe"
 *             pages: 123
 *             summary: "A short test book"
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
router.post('/', bookValidators, booksController.create);

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
 *             $ref: '#/components/schemas/Book'
 *           example:
 *             title: "Updated Book"
 *             author: "John Doe"
 *             pages: 200
 *             summary: "Updated summary"
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
  ...bookValidators,
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
