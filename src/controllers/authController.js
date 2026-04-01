/**
 * Auth Controller
 * ----------------
 * Handles HTTP requests for user registration and login.
 */

const { asyncHandler } = require('../utils/helpers');
const authService = require('../services/authService');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, college } = req.body;

  const result = await authService.register({ name, email, password, role, college });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

/**
 * @desc    Login user and return JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

module.exports = { register, login };
