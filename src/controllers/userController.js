/**
 * User Controller
 * ----------------
 * Handles user profile retrieval and updates.
 */

const { asyncHandler } = require('../utils/helpers');
const { User } = require('../models');

/**
 * @desc    Get current user's profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password'] },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * @desc    Update current user's profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, college } = req.body;

  const user = await User.findByPk(req.user.id);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Only allow updating name and college (not email/password via this route)
  if (name) user.name = name;
  if (college) user.college = college;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: user.toSafeJSON(),
  });
});

module.exports = { getProfile, updateProfile };
