/**
 * Database Configuration
 * ----------------------
 * Creates and exports a Sequelize instance connected to MySQL.
 * All credentials are loaded from environment variables.
 */

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,       // Maximum number of connections in pool
      min: 0,        // Minimum number of connections in pool
      acquire: 30000, // Max time (ms) to acquire connection before throwing error
      idle: 10000,    // Max time (ms) a connection can be idle before being released
    },
    define: {
      timestamps: true,  // Adds createdAt and updatedAt to every model
      underscored: true, // Use snake_case for auto-generated fields
    },
  }
);

module.exports = sequelize;
