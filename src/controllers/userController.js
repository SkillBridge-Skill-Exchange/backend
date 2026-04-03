/**
 * User Controller
 * ----------------
 * Handles user profile retrieval and updates.
 */

const { asyncHandler } = require('../utils/helpers');
const { User, Skill, Review, PortfolioProject, Endorsement } = require('../models');

/**
 * @desc    Get all users (Portfolios)
 * @route   GET /api/users
 * @access  Public
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { search, department, year } = req.query;
  
  const filter = {};
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } },
      { bio: { $regex: search, $options: 'i' } },
      { college: { $regex: search, $options: 'i' } }
    ];
  }

  if (department) {
    filter.department = { $regex: department, $options: 'i' };
  }

  if (year) {
    filter.year = year;
  }

  const users = await User.find(filter)
    .select('name college department year bio profile_image role')
    .lean();

  res.status(200).json({
    success: true,
    data: users,
  });
});

/**
 * @desc    Get current user's profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');

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
 * @desc    Get detailed public student profile by ID
 * @route   GET /api/users/:id
 * @access  Public
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('name college department year bio github_url linkedin_url profile_image role')
    .lean();
  
  if (!user) {
    return res.status(404).json({ success: false, message: 'Student not found.' });
  }

  // Aggregate all relevant public data for the user profile view
  const [skills, portfolio, reviews, endorsements] = await Promise.all([
    Skill.find({ user_id: user._id }).lean(),
    PortfolioProject.find({ user_id: user._id }).lean(),
    Review.find({ reviewed_user_id: user._id }).populate('reviewer_id', 'name').lean(),
    Endorsement.find({ skill_id: { $in: await Skill.find({ user_id: user._id }).distinct('_id') } }).populate('endorser_id', 'name').lean()
  ]);

  res.status(200).json({
    success: true,
    data: {
      ...user,
      skills,
      portfolio,
      reviews,
      endorsements
    }
  });
});

/**
 * @desc    Update current user's profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, college } = req.body;

  const user = await User.findById(req.user.id);

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

module.exports = { getAllUsers, getUserById, getProfile, updateProfile };
