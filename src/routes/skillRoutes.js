/**
 * Skill Routes
 * ------------
 * POST   /api/skills     - Create skill (protected)
 * GET    /api/skills      - List all skills (public)
 * GET    /api/skills/:id  - Get skill by ID (public)
 * DELETE /api/skills/:id  - Delete skill (protected, owner only)
 */

const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/authMiddleware');
const {
  createSkill,
  getAllSkills,
  getSkillById,
  deleteSkill,
  updateSkill,
} = require('../controllers/skillController');

const router = Router();

// Public routes
router.get('/', getAllSkills);
router.get('/:id', getSkillById);

// Protected routes
router.post(
  '/',
  protect,
  [
    body('skill_name').trim().notEmpty().withMessage('Skill name is required'),
    body('proficiency_level')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
      .withMessage('Invalid proficiency level'),
  ],
  validate,
  createSkill
);

router.put('/:id', protect, updateSkill);
router.delete('/:id', protect, deleteSkill);

module.exports = router;
