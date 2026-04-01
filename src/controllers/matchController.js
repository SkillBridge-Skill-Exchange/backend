const { asyncHandler } = require('../utils/helpers');
const { User, Skill, Match, sequelize } = require('../models');

/**
 * @desc    Generate AI-powered skill matches for the authenticated user
 * @route   GET /api/matches
 * @access  Private
 */
const getMatches = asyncHandler(async (req, res) => {
  // Initial simplified logic (to be replaced by Python ML)
  // Finds users who have skills that the current user DOES NOT have, and vice versa.
  
  const mySkills = await Skill.findAll({ where: { user_id: req.user.id } });
  const mySkillNames = mySkills.map(s => s.skill_name.toLowerCase());

  // Find users who offer skills I don't have
  const potentialMatches = await User.findAll({
    where: { 
      id: { [require('sequelize').Op.ne]: req.user.id } 
    },
    include: [
      { 
        model: Skill, 
        as: 'skills', 
        where: { type: 'offer' } 
      }
    ],
    limit: 10
  });

  const matches = potentialMatches.map(u => {
    // Basic overlap calculation for prototype
    const matchScore = Math.random() * 40 + 60; // Mock score 60-100% for prototype
    return {
      user: { id: u.id, name: u.name, college: u.college, department: u.department },
      match_percentage: Math.round(matchScore),
      suggested_skills: u.skills.map(s => s.skill_name).slice(0, 3)
    };
  }).sort((a, b) => b.match_percentage - a.match_percentage);

  res.status(200).json({ success: true, data: matches });
});

module.exports = { getMatches };
