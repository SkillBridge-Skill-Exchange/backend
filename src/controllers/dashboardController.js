const { asyncHandler } = require('../utils/helpers');
const { Skill, User, Request, Review, sequelize } = require('../models');

/**
 * @desc    Get dashboard stats and charts data
 * @route   GET /api/dashboard
 * @access  Private
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  // 1. My Stats
  const mySkillsCount = await Skill.countDocuments({ user_id: req.user._id });
  const myRequestsCount = await Request.countDocuments({ requester_id: req.user._id });
  
  // 2. Most in-demand skills (aggregation pipeline)
  const demandData = await Skill.aggregate([
    { $group: { _id: "$skill_name", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { skill_name: "$_id", count: 1, _id: 0 } }
  ]);

  // 3. Top contributors leaderboard
  const usersWithSkills = await User.find({}).limit(5).lean();
  const leaderboard = [];
  for (const u of usersWithSkills) {
    const sc = await Skill.countDocuments({ user_id: u._id });
    if (sc > 0) {
      leaderboard.push({
        id: u._id,
        name: u.name,
        college: u.college,
        skillsCount: sc
      });
    }
  }
  leaderboard.sort((a,b) => b.skillsCount - a.skillsCount);

  console.log(`[DASHBOARD] Stats for ${req.user.name}: skills=${mySkillsCount}, requests=${myRequestsCount}, leaderboardCount=${leaderboard.length}`);

  res.status(200).json({
    success: true,
    data: {
      myStats: { mySkillsCount, myRequestsCount },
      demandChart: demandData,
      leaderboard: leaderboard.slice(0, 5)
    }
  });
});

module.exports = { getDashboardStats };
