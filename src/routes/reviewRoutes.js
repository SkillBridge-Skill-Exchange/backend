/**
 * Review Routes (Updated)
 * POST /api/reviews          - Create a review (protected)
 * GET  /api/reviews/my       - Get reviews for authenticated user
 * GET  /api/reviews/:userId  - Get reviews for a user (public)
 */

const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/authMiddleware');
const { createReview, getReviewsByUserId } = require('../controllers/reviewController');

const router = Router();

// Protected: get my reviews
router.get('/my', protect, async (req, res, next) => {
  req.params.userId = req.user.id;
  return getReviewsByUserId(req, res, next);
});

// Public: get reviews for any user
router.get('/:userId', getReviewsByUserId);

// Protected: create a review
router.post(
  '/',
  protect,
  [
    body('reviewed_user_id').isMongoId().withMessage('Reviewed user ID must be a valid ID'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim(),
  ],
  validate,
  createReview
);

module.exports = router;
