/**
 * Server Entry Point
 * ===================
 * Loads environment variables, syncs the database, and starts the Express server.
 */

require('dotenv').config();

const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 5000;

/**
 * Start the server:
 * 1. Test database connection
 * 2. Sync Sequelize models (creates tables if they don't exist)
 * 3. Start listening on the configured port
 */
const startServer = async () => {
  try {
    // Test DB connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync models — { alter: true } updates tables without dropping data (dev-friendly)
    // For production, use migrations instead of sync
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synced successfully.');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 SkillBridge server running on http://localhost:${PORT}`);
      console.log(`📋 API Health: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
