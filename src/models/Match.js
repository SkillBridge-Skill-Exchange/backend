/**
 * Match Model
 * -----------
 * Stores AI-computed match scores between two users.
 * Designed to be populated by the matchService (currently a placeholder,
 * ready to be replaced with Python ML logic in the future).
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Match = sequelize.define('Match', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user1_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  user2_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  skill_match_score: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 1,
    },
  },
}, {
  tableName: 'matches',
});

module.exports = Match;
