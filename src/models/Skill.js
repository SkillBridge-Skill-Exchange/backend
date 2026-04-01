/**
 * Skill Model
 * -----------
 * Represents a skill that a user can offer for exchange.
 * Each skill belongs to one User and has a proficiency level.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Skill = sequelize.define('Skill', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  skill_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Skill name is required' },
    },
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  proficiency_level: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
    defaultValue: 'beginner',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('offer', 'request'),
    defaultValue: 'offer',
  },
}, {
  tableName: 'skills',
});

module.exports = Skill;
