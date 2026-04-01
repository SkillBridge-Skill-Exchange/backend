const express = require('express');
const router = express.Router();
const { endorseSkill, getSkillEndorsements } = require('../controllers/endorsementController');
const { protect } = require('../middlewares/authMiddleware');
const { Endorsement, User } = require('../models');
const { asyncHandler } = require('../utils/helpers');

// Get all endorsements for the authenticated user's skills
router.get('/all', protect, asyncHandler(async (req, res) => {
  const { Skill } = require('../models');
  const mySkills = await Skill.findAll({ where: { user_id: req.user.id }, attributes: ['id'] });
  const skillIds = mySkills.map(s => s.id);
  
  const endorsements = await Endorsement.findAll({
    where: { skill_id: skillIds },
    include: [{ model: User, as: 'endorser', attributes: ['id', 'name', 'college'] }],
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({ success: true, data: endorsements });
}));

// Get endorsements for a specific skill
router.get('/:skillId', getSkillEndorsements);

// Endorse a skill
router.post('/', protect, endorseSkill);

module.exports = router;
