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

/* Common validators */
const bookValidators = [
  body('title').trim().notEmpty().withMessage('title is required'),
  body('author').trim().notEmpty().withMessage('author is required'),
  body('pages').isInt({ min: 1 }).withMessage('pages must be integer >= 1'),
  body('summary').trim().notEmpty().withMessage('summary is required'),
  checkValidation
];

/* Routes */
router.get('/', booksController.getAll);

router.get('/:id',
  param('id').isMongoId().withMessage('Invalid ID'),
  checkValidation,
  booksController.getById
);

router.post('/', bookValidators, booksController.create);
router.put('/:id',
  param('id').isMongoId().withMessage('Invalid ID'),
  ...bookValidators,
  booksController.update
);

router.delete('/:id',
  param('id').isMongoId().withMessage('Invalid ID'),
  checkValidation,
  booksController.remove
);

module.exports = router;
