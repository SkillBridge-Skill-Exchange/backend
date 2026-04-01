const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PortfolioProject = sequelize.define('PortfolioProject', {
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
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  project_link: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: { isUrl: true },
  },
  github_link: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: { isUrl: true },
  },
  image_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'portfolio_projects',
});

module.exports = PortfolioProject;
