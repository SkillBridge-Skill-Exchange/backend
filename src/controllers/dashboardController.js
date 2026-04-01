const { asyncHandler } = require('../utils/helpers');
const { Skill, User, Request, Review, sequelize } = require('../models');

/**
 * @desc    Get dashboard stats and charts data
 * @route   GET /api/dashboard
 * @access  Private
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  // 1. My Stats
  const mySkillsCount = await Skill.count({ where: { user_id: req.user.id } });
  const myRequestsCount = await Request.count({ where: { requester_id: req.user.id } });
  
  // 2. Most in-demand skills (chart data)
  const demandData = await Skill.findAll({
    attributes: [
      'skill_name',
      [sequelize.fn('COUNT', sequelize.col('skill_name')), 'count']
    ],
    group: ['skill_name'],
    order: [[sequelize.literal('count'), 'DESC']],
    limit: 5
  });

  // 3. Top contributors leaderboard
  const leaderboard = await User.findAll({
    attributes: [
      'id', 'name', 'college',
      [sequelize.literal('(SELECT COUNT(*) FROM skills WHERE skills.user_id = User.id)'), 'skillsCount']
    ],
    order: [[sequelize.literal('skillsCount'), 'DESC']],
    limit: 5
  });

  res.status(200).json({
    success: true,
    data: {
      myStats: { mySkillsCount, myRequestsCount },
      demandChart: demandData,
      leaderboard
    }
  });
});

module.exports = { getDashboardStats };
