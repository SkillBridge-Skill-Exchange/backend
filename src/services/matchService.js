/**
 * Match Service (AI Placeholder)
 * --------------------------------
 * This service provides skill-matching logic between users.
 *
 * CURRENT: Uses simple Jaccard similarity on skill names.
 * FUTURE:  This function is designed to be replaced by a Python ML model
 *          (e.g., via a REST call to a Flask/FastAPI microservice).
 *
 * To integrate ML later:
 *   1. Replace calculateMatchScore() with an HTTP call to your Python service
 *   2. Or use child_process to call a Python script
 *   3. The interface (input/output) should remain the same
 */

/**
 * Calculate a match score between two sets of user skills.
 *
 * @param {Array<Object>} userSkills   - Skills of user 1 (each has skill_name, category, proficiency_level)
 * @param {Array<Object>} targetSkills - Skills of user 2
 * @returns {number} A score between 0 and 1 (1 = perfect match)
 */
const calculateMatchScore = (userSkills, targetSkills) => {
  // Edge case: if either user has no skills, no match
  if (!userSkills.length || !targetSkills.length) {
    return 0;
  }

  // Extract skill names (normalized to lowercase)
  const userSkillNames = new Set(userSkills.map((s) => s.skill_name.toLowerCase()));
  const targetSkillNames = new Set(targetSkills.map((s) => s.skill_name.toLowerCase()));

  // Jaccard similarity: |intersection| / |union|
  const intersection = new Set([...userSkillNames].filter((s) => targetSkillNames.has(s)));
  const union = new Set([...userSkillNames, ...targetSkillNames]);

  const jaccardScore = intersection.size / union.size;

  // Category bonus: if skills share categories, add a small bonus
  const userCategories = new Set(userSkills.map((s) => (s.category || '').toLowerCase()).filter(Boolean));
  const targetCategories = new Set(targetSkills.map((s) => (s.category || '').toLowerCase()).filter(Boolean));
  const categoryIntersection = new Set([...userCategories].filter((c) => targetCategories.has(c)));
  const categoryBonus = userCategories.size > 0 && targetCategories.size > 0
    ? (categoryIntersection.size / Math.max(userCategories.size, targetCategories.size)) * 0.2
    : 0;

  // Combine scores, cap at 1.0
  const finalScore = Math.min(jaccardScore + categoryBonus, 1.0);

  return parseFloat(finalScore.toFixed(4));
};

/**
 * Find matches for a given user against all other users.
 * @param {number} userId - The current user's ID
 * @param {Object} models - { User, Skill, Match } Sequelize models
 * @returns {Array<Object>} Array of { matchedUser, score }
 */
const findMatchesForUser = async (userId, models) => {
  const { User, Skill, Match } = models;

  // Get the current user's skills
  const currentUser = await User.findByPk(userId, {
    include: [{ model: Skill, as: 'skills' }],
  });

  if (!currentUser || !currentUser.skills.length) {
    return [];
  }

  // Get all other users with their skills
  const otherUsers = await User.findAll({
    where: { id: { [require('sequelize').Op.ne]: userId } },
    include: [{ model: Skill, as: 'skills' }],
    attributes: { exclude: ['password'] },
  });

  const matches = [];

  for (const otherUser of otherUsers) {
    if (!otherUser.skills.length) continue;

    const score = calculateMatchScore(currentUser.skills, otherUser.skills);

    if (score > 0) {
      // Upsert match record in the database
      const [matchRecord] = await Match.findOrCreate({
        where: { user1_id: userId, user2_id: otherUser.id },
        defaults: { skill_match_score: score },
      });

      // Update score if it changed
      if (matchRecord.skill_match_score !== score) {
        await matchRecord.update({ skill_match_score: score });
      }

      matches.push({
        matchId: matchRecord.id,
        matchedUser: {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          college: otherUser.college,
          skills: otherUser.skills,
        },
        score,
      });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  return matches;
};

module.exports = { calculateMatchScore, findMatchesForUser };
