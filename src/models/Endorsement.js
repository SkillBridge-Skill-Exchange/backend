const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Endorsement = sequelize.define('Endorsement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  skill_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'skills',
      key: 'id',
    },
  },
  endorser_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'endorsements',
});

module.exports = Endorsement;
