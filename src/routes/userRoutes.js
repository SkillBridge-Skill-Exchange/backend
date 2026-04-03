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
const { getAllUsers, getUserById, getProfile, updateProfile } = require('../controllers/userController');

const router = Router();

// Public routes (for landing page / student discovery)
router.get('/', getAllUsers);
router.get('/:id', getUserById);

// Protected routes (require valid JWT)
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile/block/:id', require('../controllers/userController').toggleBlockUser);

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
