/**
 * Review Controller
 * ------------------
 * Handles creating and retrieving reviews for users.
 */

const { asyncHandler } = require('../utils/helpers');
const { Review, User } = require('../models');

/**
 * @desc    Create a review for another user
 * @route   POST /api/reviews
 * @access  Private
 */
const createReview = asyncHandler(async (req, res) => {
  const { reviewed_user_id, rating, comment } = req.body;

  // Prevent self-review
  if (reviewed_user_id === req.user.id) {
    const error = new Error('You cannot review yourself');
    error.statusCode = 400;
    throw error;
  }

  // Verify the reviewed user exists
  const reviewedUser = await User.findByPk(reviewed_user_id);
  if (!reviewedUser) {
    const error = new Error('User to review not found');
    error.statusCode = 404;
    throw error;
  }

  const review = await Review.create({
    reviewer_id: req.user.id,
    reviewed_user_id,
    rating,
    comment,
  });

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: review,
  });
});

/**
 * @desc    Get all reviews for a specific user
 * @route   GET /api/reviews/:userId
 * @access  Public
 */
const getReviewsByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const reviews = await Review.findAll({
    where: { reviewed_user_id: userId },
    include: [
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'name', 'email'],
      },
    ],
    order: [['created_at', 'DESC']],
  });

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
    : 0;

  res.status(200).json({
    success: true,
    count: reviews.length,
    averageRating: parseFloat(avgRating),
    data: reviews,
  });
});

module.exports = { createReview, getReviewsByUserId };
