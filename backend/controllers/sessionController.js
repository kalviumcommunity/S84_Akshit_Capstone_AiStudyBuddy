const Session = require('../models/Session');
const { body, validationResult } = require('express-validator');

// Validation middleware for creating a session
const validateSession = [
  body('user').notEmpty().withMessage('User ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
];

// Get all sessions
const getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get session by ID
const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get sessions by user ID
const getSessionsByUser = async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new session
const createSession = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { user, title, description, startTime, tags, content } = req.body;
    
    if (!user.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const sessionData = {
      user,
      title,
      startTime: new Date(startTime),
      status: 'active'
    };
    
    // Add optional fields if they exist
    if (description) sessionData.description = description;
    if (tags && Array.isArray(tags)) sessionData.tags = tags;
    if (content && Array.isArray(content)) sessionData.content = content;
    
    const newSession = await Session.create(sessionData);
    return res.status(201).json(newSession);
  } catch (error) {
    console.error("Session creation error:", error);
    
    // Check for duplicate key error
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(409).json({
        message: 'This session already exists',
        error: 'Duplicate session'
      });
    }
    
    return res.status(500).json({ 
      message: 'Failed to create session', 
      error: error.message 
    });
  }
};

// Delete a session
const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid session ID format' });
    }
    
    const deletedSession = await Session.findByIdAndDelete(id);
    
    if (!deletedSession) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    res.status(200).json({ message: 'Session deleted successfully', deletedSession });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      error: 'Failed to delete session',
      message: error.message
    });
  }
};

module.exports = {
  getAllSessions,
  getSessionById,
  getSessionsByUser,
  createSession,
  validateSession,
  deleteSession
};
