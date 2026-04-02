/**
 * Request Routes
 * ---------------
 * POST  /api/requests            - Create a request (protected)
 * GET   /api/requests            - Get all requests (protected)
 * PATCH /api/requests/:id/status - Update request status (protected)
 */

const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/authMiddleware');
const {
  createRequest,
  getRequests,
  updateRequestStatus,
} = require('../controllers/requestController');

const router = Router();

// All request routes require authentication
router.use(protect);

router.post(
  '/',
  [
    body('skill_id').isMongoId().withMessage('Skill ID must be a valid Mongo ID'),
    body('message').optional().trim(),
  ],
  validate,
  createRequest
);

router.get('/', getRequests);

router.patch(
  '/:id/status',
  [
    body('status')
      .isIn(['accepted', 'declined']) // Changed 'rejected' to 'declined'
      .withMessage('Status must be accepted or declined'),
  ],
  validate,
  updateRequestStatus
);

module.exports = router;
