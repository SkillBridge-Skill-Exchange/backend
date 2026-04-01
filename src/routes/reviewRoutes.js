/**
 * Review Routes
 * -------------
 * POST /api/reviews          - Create a review (protected)
 * GET  /api/reviews/:userId  - Get reviews for a user (public)
 */

const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/authMiddleware');
const { createReview, getReviewsByUserId } = require('../controllers/reviewController');

const router = Router();

// Public: get reviews for any user
router.get('/:userId', getReviewsByUserId);

// Protected: create a review
router.post(
  '/',
  protect,
  [
    body('reviewed_user_id').isInt().withMessage('Reviewed user ID must be an integer'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim(),
  ],
  validate,
  createReview
);

module.exports = router;
