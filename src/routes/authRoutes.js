/**
 * Auth Routes
 * -----------
 * POST /api/auth/register - Register a new user
 * POST /api/auth/login    - Login and receive JWT
 */

const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { register, login } = require('../controllers/authController');

const router = Router();

// Validation rules for registration
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['student', 'admin'])
    .withMessage('Role must be student or admin'),
];

// Validation rules for login
const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);

module.exports = router;
