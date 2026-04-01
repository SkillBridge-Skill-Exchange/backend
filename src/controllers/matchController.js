/**
 * Match Controller (Enhanced with Cosine Similarity)
 * ====================================================
 * AI-powered skill matching using cosine similarity engine.
 * Task Owner: Regella Krishna Saketh (Cosine similarity engine, AI match %)
 */

const { asyncHandler } = require('../utils/helpers');
const { User, Skill, Match, sequelize } = require('../models');

/**
 * Build a skill vocabulary from all skills in database,
 * then compute cosine similarity between user skill vectors.
 */
const cosineSimilarity = (vec1, vec2) => {
  let dot = 0, mag1 = 0, mag2 = 0;
  for (let i = 0; i < vec1.length; i++) {
    dot += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  if (mag1 === 0 || mag2 === 0) return 0;
  return dot / (mag1 * mag2);
};

const proficiencyWeight = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };

/**
 * @desc    Generate AI-powered skill matches using cosine similarity
 * @route   GET /api/matches
 * @access  Private
 */
const getMatches = asyncHandler(async (req, res) => {
  const mySkills = await Skill.findAll({ where: { user_id: req.user.id } });
  
  if (mySkills.length === 0) {
    return res.status(200).json({ success: true, data: [] });
  }

  // Get all users with skills
  const allUsers = await User.findAll({
    where: { id: { [require('sequelize').Op.ne]: req.user.id } },
    include: [{ model: Skill, as: 'skills' }],
    attributes: { exclude: ['password'] }
  });

  // Build vocabulary from all skill names
  const allSkillNames = new Set();
  mySkills.forEach(s => allSkillNames.add(s.skill_name.toLowerCase()));
  allUsers.forEach(u => u.skills.forEach(s => allSkillNames.add(s.skill_name.toLowerCase())));
  const vocabulary = [...allSkillNames];

  // Build my vector (weighted by proficiency)
  const myVector = vocabulary.map(v => {
    const skill = mySkills.find(s => s.skill_name.toLowerCase() === v);
    return skill ? (proficiencyWeight[skill.proficiency_level] || 1) : 0;
  });

  // Compute cosine similarity for each user
  const matches = allUsers
    .filter(u => u.skills.length > 0)
    .map(u => {
      const userVector = vocabulary.map(v => {
        const skill = u.skills.find(s => s.skill_name.toLowerCase() === v);
        return skill ? (proficiencyWeight[skill.proficiency_level] || 1) : 0;
      });

      const similarity = cosineSimilarity(myVector, userVector);
      
      // Category bonus: complementary skills (I request, they offer) get a boost
      const myRequests = mySkills.filter(s => s.type === 'request').map(s => s.skill_name.toLowerCase());
      const theirOffers = u.skills.filter(s => s.type === 'offer').map(s => s.skill_name.toLowerCase());
      const complementary = myRequests.filter(r => theirOffers.includes(r)).length;
      const complementaryBonus = complementary * 0.05;

      const matchScore = Math.min((similarity + complementaryBonus) * 100, 99);

      return {
        user: { 
          id: u.id, name: u.name, college: u.college, department: u.department 
        },
        match_percentage: Math.round(matchScore),
        suggested_skills: u.skills.map(s => s.skill_name).slice(0, 3),
        similarity_raw: similarity.toFixed(4)
      };
    })
    .filter(m => m.match_percentage > 0)
    .sort((a, b) => b.match_percentage - a.match_percentage)
    .slice(0, 10);

  res.status(200).json({ success: true, data: matches });
});

module.exports = { getMatches };
