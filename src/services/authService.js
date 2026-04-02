/**
 * Auth Service
 * ------------
 * Business logic for user registration and login.
 * Handles password hashing (via model hooks) and JWT generation.
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Generate a JWT token for a given user ID.
 * @param {number} id - User ID
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Register a new user.
 * @param {Object} userData - { name, email, password, role, college }
 * @returns {Object} { user, token }
 */
const register = async (userData) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }

  // Create the user (password hashed by model middleware)
  const user = await User.create(userData);
  const token = generateToken(user._id);

  return {
    user: user.toSafeJSON(),
    token,
  };
};

const login = async (email, password) => {
  // Find user by email and explicitly include password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Compare passwords (using instance method in User model)
  const isMatch = await user.comparePassword(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user._id);

  return {
    user: user.toSafeJSON(),
    token,
  };
};

module.exports = { register, login, generateToken };
