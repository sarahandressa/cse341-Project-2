const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const clubsController = require('../controllers/clubsController');
const { isAuthenticated } = require('../middleware/authenticate');

/* ------------------------ VALIDATION ------------------------ */
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const clubValidators = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('description').trim().notEmpty().withMessage('description is required'),
  body('genre').trim().notEmpty().withMessage('genre is required'),
  body('schedule').trim().notEmpty().withMessage('schedule is required'),
  body('membersLimit').optional().isInt({ min: 1 }).withMessage('membersLimit must be integer >= 1'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  checkValidation,
];

/* ------------------------ SWAGGER / OPENAPI ------------------------ */

/**
 * @openapi
 * components:
 *   schemas:
 *     Club:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - genre
 *         - schedule
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         genre:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         schedule:
 *           type: string
 *         membersLimit:
 *           type: integer
 *         isActive:
 *           type: boolean
 */

/**
 * @openapi
 * tags:
 *   - name: "Clubs"
 *     description: "Book club management"
 */

/**
 * @openapi
 * /clubs:
 *   get:
 *     summary: Get all clubs
 *     tags:
 *       - "Clubs"
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Club'
 */
router.get('/', clubsController.getAllClubs);

/**
 * @openapi
 * /clubs/{id}:
 *   get:
 *     summary: Get a club by ID
 *     tags:
 *       - "Clubs"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Club'
 *       '400':
 *         description: Invalid ID
 *       '404':
 *         description: Not Found
 */
router.get('/:id', param('id').isMongoId().withMessage('Invalid ID'), checkValidation, clubsController.getClubById);

/**
 * @openapi
 * /clubs:
 *   post:
 *     summary: Create a new club (requires login)
 *     tags:
 *       - "Clubs"
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Club'
 *     responses:
 *       '201':
 *         description: Club created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Club'
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Unauthorized
 */
router.post('/', isAuthenticated, clubValidators, async (req, res, next) => {
  try {
    const newClub = await clubsController.createClub(req, res);
    res.status(201).json({ message: 'Bookclub created successfully!', club: newClub });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /clubs/{id}:
 *   put:
 *     summary: Update a club by ID (requires login)
 *     tags:
 *       - "Clubs"
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Club'
 *     responses:
 *       '200':
 *         description: Club updated successfully
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Not Found
 */
router.put('/:id', isAuthenticated, param('id').isMongoId().withMessage('Invalid ID'), clubValidators, clubsController.updateClub);

/**
 * @openapi
 * /clubs/{id}:
 *   delete:
 *     summary: Delete a club by ID (requires login)
 *     tags:
 *       - "Clubs"
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId
 *     responses:
 *       '200':
 *         description: Club deleted successfully
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Not Found
 */
router.delete('/:id', isAuthenticated, param('id').isMongoId().withMessage('Invalid ID'), checkValidation, clubsController.deleteClub);

module.exports = router;
