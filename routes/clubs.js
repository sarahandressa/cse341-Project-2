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
    body('name').notEmpty().withMessage('Club name is required.'),
    body('description').notEmpty().withMessage('Club description is required.'),
    body('privacy').isIn(['public', 'private']).withMessage('Privacy must be "public" or "private".'),
    checkValidation,
];

// --- API Endpoints (Documentation now handled by swagger/paths.yaml) ---

// GET ALL CLUBS (READ)
router.get('/', clubsController.getAllClubs);

// GET SINGLE CLUB (READ)
router.get('/:id', param('id').isMongoId().withMessage('Invalid Club ID'), checkValidation, clubsController.getClubById);

// POST CLUB (CREATE) - PROTECTED
router.post('/', isAuthenticated, clubValidators, clubsController.createClub);

// PUT CLUB (UPDATE) - PROTECTED
router.put('/:id', isAuthenticated, param('id').isMongoId().withMessage('Invalid Club ID'), clubValidators, clubsController.updateClub);

// DELETE CLUB (DELETE) - PROTECTED
router.delete('/:id', isAuthenticated, param('id').isMongoId().withMessage('Invalid Club ID'), checkValidation, clubsController.deleteClub);

module.exports = router;