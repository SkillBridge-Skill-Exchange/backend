/**
 * Models Index
 * ------------
 * Central hub that imports all models, defines associations/relationships
 * between them, and re-exports everything for use across the application.
 */

const sequelize = require('../config/database');
const User = require('./User');
const Skill = require('./Skill');
const Request = require('./Request');
const Match = require('./Match');
const Review = require('./Review');

// ==========================================
// Define Associations / Relationships
// ==========================================

// User ↔ Skill (One-to-Many)
// A user can have many skills; each skill belongs to one user
User.hasMany(Skill, { foreignKey: 'user_id', as: 'skills', onDelete: 'CASCADE' });
Skill.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

// User ↔ Request (One-to-Many) — as requester
User.hasMany(Request, { foreignKey: 'requester_id', as: 'sentRequests', onDelete: 'CASCADE' });
Request.belongsTo(User, { foreignKey: 'requester_id', as: 'requester' });

// Skill ↔ Request (One-to-Many) — each request targets a skill
Skill.hasMany(Request, { foreignKey: 'skill_id', as: 'requests', onDelete: 'CASCADE' });
Request.belongsTo(Skill, { foreignKey: 'skill_id', as: 'skill' });

// User ↔ Match (user1 and user2)
User.hasMany(Match, { foreignKey: 'user1_id', as: 'matchesAsUser1' });
User.hasMany(Match, { foreignKey: 'user2_id', as: 'matchesAsUser2' });
Match.belongsTo(User, { foreignKey: 'user1_id', as: 'user1' });
Match.belongsTo(User, { foreignKey: 'user2_id', as: 'user2' });

// User ↔ Review (reviewer and reviewed)
User.hasMany(Review, { foreignKey: 'reviewer_id', as: 'givenReviews' });
User.hasMany(Review, { foreignKey: 'reviewed_user_id', as: 'receivedReviews' });
Review.belongsTo(User, { foreignKey: 'reviewer_id', as: 'reviewer' });
Review.belongsTo(User, { foreignKey: 'reviewed_user_id', as: 'reviewedUser' });

// ==========================================
// Export everything
// ==========================================

module.exports = {
  sequelize,
  User,
  Skill,
  Request,
  Match,
  Review,
};
