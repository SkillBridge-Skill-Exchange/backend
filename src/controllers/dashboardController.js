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

  // 3. Top contributors leaderboard (aggregation pipeline)
  // We join User with Skill count manually or using lookup
  const leaderboard = await User.aggregate([
    {
      $lookup: {
        from: "skills",
        localField: "_id",
        foreignField: "user_id",
        as: "userSkills"
      }
    },
    {
      $project: {
        name: 1,
        college: 1,
        skillsCount: { $size: "$userSkills" }
      }
    },
    { $sort: { skillsCount: -1 } },
    { $limit: 5 }
  ]);

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
