const express = require('express');
const router = express.Router();
const { endorseSkill, getSkillEndorsements } = require('../controllers/endorsementController');
const { protect } = require('../middlewares/authMiddleware');
const { Endorsement, User } = require('../models');
const { asyncHandler } = require('../utils/helpers');

// Get all endorsements for the authenticated user's skills
router.get('/all', protect, asyncHandler(async (req, res) => {
  const { Skill } = require('../models');
  const mySkills = await Skill.find({ user_id: req.user._id }).distinct('_id');
  
  const endorsements = await Endorsement.find({ skill_id: { $in: mySkills } })
    .populate('endorser_id', 'name college')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, data: endorsements });
}));

// Get endorsements for a specific skill
router.get('/:skillId', getSkillEndorsements);

// Endorse a skill
router.post('/', protect, endorseSkill);

module.exports = router;
