/**
 * Auth Middleware
 * ---------------
 * Verifies JWT tokens from the Authorization header.
 * Attaches the decoded user payload to `req.user` for downstream use.
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Protect routes — only authenticated users can proceed.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from "Bearer <token>" header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — no token provided',
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (exclude password)
    const user = await User.findById(decoded.id);


    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — user not found',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — invalid token',
    });
  }
};

/**
 * Restrict access to specific roles (e.g., 'admin').
 * Must be used AFTER the protect middleware.
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
