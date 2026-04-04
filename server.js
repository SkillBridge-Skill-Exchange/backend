require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initializeSocket } = require('./src/socket/socketHandler');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:3001',
          'https://skillbridgeubayognexus.vercel.app'
        ],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Initialize all socket event handlers
    initializeSocket(io);

    server.listen(PORT, () => {
      console.log(`🚀 SkillBridge server running on http://localhost:${PORT}`);
      console.log(`📋 API Health: http://localhost:${PORT}/api/health`);
      console.log(`🔌 Socket.IO ready`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
