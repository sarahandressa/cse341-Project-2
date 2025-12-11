const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const meetingsController = require('../controllers/meetingsController');
const { isAuthenticated } = require('../middleware/authenticate');

/* ------------------------ VALIDATION ------------------------ */
const checkValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
};

const meetingValidators = [
    body('clubId').isMongoId().withMessage('Club ID is required and must be valid.'),
    body('agenda').notEmpty().withMessage('Agenda is required.'),
    body('dateTime').isISO8601().toDate().withMessage('Date and time must be a valid ISO 8601 string.'),
    checkValidation,
];

// --- API Endpoints (Documentation now handled by swagger/paths.yaml) ---

// GET ALL MEETINGS BY CLUB (READ)
router.get('/club/:clubId', param('clubId').isMongoId().withMessage('Invalid Club ID'), checkValidation, meetingsController.getMeetingsByClubId);

// GET SINGLE MEETING (READ)
router.get('/:id', param('id').isMongoId().withMessage('Invalid Meeting ID'), checkValidation, meetingsController.getMeetingById);

// POST MEETING (CREATE) - PROTECTED
router.post('/', isAuthenticated, meetingValidators, meetingsController.createMeeting);

// PUT MEETING (UPDATE) - PROTECTED
router.put('/:id', isAuthenticated, param('id').isMongoId().withMessage('Invalid Meeting ID'), meetingValidators, meetingsController.updateMeeting);

// DELETE MEETING (DELETE) - PROTECTED
router.delete('/:id', isAuthenticated, param('id').isMongoId().withMessage('Invalid Meeting ID'), checkValidation, meetingsController.deleteMeeting);

// POST ATTENDANCE (JOIN) - PROTECTED
router.post('/:id/attend', isAuthenticated, param('id').isMongoId().withMessage('Invalid Meeting ID'), checkValidation, meetingsController.addAttendee);

// DELETE ATTENDANCE (LEAVE) - PROTECTED
router.delete('/:id/attend', isAuthenticated, param('id').isMongoId().withMessage('Invalid Meeting ID'), checkValidation, meetingsController.removeAttendee);

module.exports = router;