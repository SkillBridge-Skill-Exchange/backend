const { asyncHandler } = require('../utils/helpers');
const { Review, User } = require('../models');

const createReview = asyncHandler(async (req, res) => {
  const { reviewed_user_id, rating, comment } = req.body;

  if (reviewed_user_id === req.user._id.toString()) {
    const error = new Error('You cannot review yourself');
    error.statusCode = 400;
    throw error;
  }

  const reviewedUser = await User.findById(reviewed_user_id);
  if (!reviewedUser) {
    const error = new Error('User to review not found');
    error.statusCode = 404;
    throw error;
  }

  const review = await Review.create({
    reviewer_id: req.user._id,
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

const getReviewsByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const reviews = await Review.find({ reviewed_user_id: userId })
    .populate('reviewer_id', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  // Format for frontend: rename reviewer_id to reviewer, add id
  const formatted = reviews.map(r => ({
    ...r,
    id: r._id.toString(),
    reviewer: r.reviewer_id || {},
  }));

  const avgRating = formatted.length > 0
    ? (formatted.reduce((sum, r) => sum + r.rating, 0) / formatted.length).toFixed(2)
    : 0;

  res.status(200).json({
    success: true,
    count: formatted.length,
    averageRating: parseFloat(avgRating),
    data: formatted,
  });
});

module.exports = { createReview, getReviewsByUserId };
