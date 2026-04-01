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
const PortfolioProject = require('./PortfolioProject');
const Endorsement = require('./Endorsement');
const Notification = require('./Notification');
const { Conversation, Message } = require('./Messenger');

// ==========================================
// Define Associations / Relationships
// ==========================================

// User ↔ Skill (One-to-Many)
User.hasMany(Skill, { foreignKey: 'user_id', as: 'skills', onDelete: 'CASCADE' });
Skill.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

// User ↔ PortfolioProject (One-to-Many)
User.hasMany(PortfolioProject, { foreignKey: 'user_id', as: 'projects', onDelete: 'CASCADE' });
PortfolioProject.belongsTo(User, { foreignKey: 'user_id' });

// Skill ↔ Endorsement (One-to-Many)
Skill.hasMany(Endorsement, { foreignKey: 'skill_id', as: 'endorsements', onDelete: 'CASCADE' });
Endorsement.belongsTo(Skill, { foreignKey: 'skill_id' });

// User ↔ Endorsement (Endorser)
User.hasMany(Endorsement, { foreignKey: 'endorser_id', as: 'givenEndorsements' });
Endorsement.belongsTo(User, { foreignKey: 'endorser_id', as: 'endorser' });

// User ↔ Notification (One-to-Many)
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

// User ↔ Conversation
User.hasMany(Conversation, { foreignKey: 'user1_id', as: 'conversations1' });
User.hasMany(Conversation, { foreignKey: 'user2_id', as: 'conversations2' });
Conversation.belongsTo(User, { foreignKey: 'user1_id', as: 'user1' });
Conversation.belongsTo(User, { foreignKey: 'user2_id', as: 'user2' });

// Conversation ↔ Message
Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages', onDelete: 'CASCADE' });
Message.belongsTo(Conversation, { foreignKey: 'conversation_id' });

// User ↔ Message (Sender)
User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// User ↔ Request
User.hasMany(Request, { foreignKey: 'requester_id', as: 'sentRequests', onDelete: 'CASCADE' });
Request.belongsTo(User, { foreignKey: 'requester_id', as: 'requester' });

// Skill ↔ Request
Skill.hasMany(Request, { foreignKey: 'skill_id', as: 'requests', onDelete: 'CASCADE' });
Request.belongsTo(Skill, { foreignKey: 'skill_id', as: 'skill' });

// User ↔ Match
User.hasMany(Match, { foreignKey: 'user1_id', as: 'matchesAsUser1' });
User.hasMany(Match, { foreignKey: 'user2_id', as: 'matchesAsUser2' });
Match.belongsTo(User, { foreignKey: 'user1_id', as: 'user1' });
Match.belongsTo(User, { foreignKey: 'user2_id', as: 'user2' });

// User ↔ Review
User.hasMany(Review, { foreignKey: 'reviewer_id', as: 'givenReviews' });
User.hasMany(Review, { foreignKey: 'reviewed_user_id', as: 'receivedReviews' });
Review.belongsTo(User, { foreignKey: 'reviewer_id', as: 'reviewer' });
Review.belongsTo(User, { foreignKey: 'reviewed_user_id', as: 'reviewedUser' });

module.exports = {
  sequelize,
  User,
  Skill,
  Request,
  Match,
  Review,
  PortfolioProject,
  Endorsement,
  Notification,
  Conversation,
  Message,
};
