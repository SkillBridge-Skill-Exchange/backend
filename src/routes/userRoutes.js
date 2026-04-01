/**
 * User Routes
 * -----------
 * GET /api/users/profile - Get own profile (protected)
 * PUT /api/users/profile - Update own profile (protected)
 */

const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/authMiddleware');
const { getProfile, updateProfile } = require('../controllers/userController');

const router = Router();

// All user routes require authentication
router.use(protect);

router.get('/profile', getProfile);

router.put(
  '/profile',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('college').optional().trim(),
  ],
  validate,
  updateProfile
);

module.exports = router;
