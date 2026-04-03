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

  // 3. Top contributors leaderboard - prioritize users with skills
  const skillsWithUsers = await Skill.find({}).limit(50).lean();
  const leaderMap = {};
  for (const s of skillsWithUsers) {
    const uid = s.user_id.toString();
    leaderMap[uid] = (leaderMap[uid] || 0) + 1;
  }
  
  const leaderboard = [];
  for (const [uid, count] of Object.entries(leaderMap)) {
    const u = await User.findById(uid).lean();
    if (u) {
      leaderboard.push({
        id: u._id,
        name: u.name,
        college: u.college,
        skillsCount: count
      });
    }
  }
  leaderboard.sort((a,b) => b.skillsCount - a.skillsCount);

  // Global verification info
  const totalGlobalSkills = await Skill.countDocuments({});

  console.log(`[DASHBOARD-v2.1] Stats for ${req.user.name} (${req.user._id}): mySkills=${mySkillsCount}, globalTotal=${totalGlobalSkills}, leaderboardLen=${leaderboard.length}`);

  res.status(200).json({
    success: true,
    data: {
      debugVersion: 'v2.1-RealDataFocus',
      totalGlobalSkills,
      myStats: { mySkillsCount, myRequestsCount },
      demandChart: demandData,
      leaderboard: leaderboard.slice(0, 5)
    }
  });
});

module.exports = { getDashboardStats };
