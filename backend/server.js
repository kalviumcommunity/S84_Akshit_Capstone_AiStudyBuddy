const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

dotenv.config();

const app = express();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set in environment variables');
  process.exit(1);
}

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('MONGODB_URI is not set in environment variables');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Could not connect to MongoDB:', err);
    console.log('Server will continue running without MongoDB connection...');
    // Don't exit the process, allow server to run for testing
  });

// CORS configuration
const corsOptions = {
  origin: [
    'https://aistudybuddy.onrender.com',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://aistudybuddy.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions)); // <-- Handles all CORS including OPTIONS preflight

// Import routes
const uploadRoutes = require('./routes/upload');
const sessionRoutes = require('./routes/sessionRoutes');
const noteRoutes = require('./routes/noteRoutes');
const videoRoutes = require('./routes/videoRoutes');
const putRoutes = require('./routes/putRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const aiRoutes = require('./routes/aiRoutes');
const driveRoutes = require('./routes/driveRoutes');

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to AI Study Buddy API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      users: '/api/users',
      sessions: '/api/sessions',
      notes: '/api/notes',
      videos: '/api/videos',
      upload: '/api/upload',
      chat: '/api/chat',
      ai: '/api/ai'
    }
  });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);  // Mount at /api/chat
app.use('/api/ai', aiRoutes);
app.use('/api/drive', driveRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message || 'An unexpected error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.path
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}🚀`);
  console.log('Available routes:');
  console.log('- /api/users');
  console.log('- /api/sessions');
  console.log('- /api/notes');
  console.log('- /api/videos');
  console.log('- /api/upload');
  console.log('- /api/chat');
  console.log('- /api/ai');
  console.log('- /api/drive');
  
  // Initialize Drive sync cron job
  initializeDriveSync();
});

// Initialize automatic Drive sync
function initializeDriveSync() {
  const driveSyncService = require('./services/driveSyncService');
  
  // Run sync every hour (at minute 0)
  // Cron format: minute hour day month weekday
  cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled Drive sync...');
    try {
      await driveSyncService.syncAllDriveSources();
    } catch (error) {
      console.error('Scheduled Drive sync failed:', error);
    }
  });

  console.log('Drive sync scheduler initialized (runs every hour)');
}
