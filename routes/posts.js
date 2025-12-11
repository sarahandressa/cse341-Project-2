const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const postsController = require('../controllers/postsController');
const { isAuthenticated } = require('../middleware/authenticate');

/* ------------------------ VALIDATION ------------------------ */
const checkValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
};

const postValidators = [
    body('club').isMongoId().withMessage('Club ID is required and must be valid.'),
    body('title').notEmpty().withMessage('Title is required.'),
    body('content').notEmpty().withMessage('Content is required.'),
    checkValidation,
];

// --- API Endpoints (Documentation now handled by swagger/paths.yaml) ---

// GET ALL POSTS BY CLUB (READ)
router.get('/club/:clubId', param('clubId').isMongoId().withMessage('Invalid Club ID'), checkValidation, postsController.getPostsByClubId);

// GET SINGLE POST (READ)
router.get('/:id', param('id').isMongoId().withMessage('Invalid Post ID'), checkValidation, postsController.getPostById);

// POST POST (CREATE) - PROTECTED
router.post('/', isAuthenticated, postValidators, postsController.createPost);

// PUT POST (UPDATE) - PROTECTED
router.put('/:id', isAuthenticated, param('id').isMongoId().withMessage('Invalid Post ID'), postValidators, postsController.updatePost);

// DELETE POST (DELETE) - PROTECTED
router.delete('/:id', isAuthenticated, param('id').isMongoId().withMessage('Invalid Post ID'), checkValidation, postsController.deletePost);

module.exports = router;