const { body, validationResult } = require('express-validator');
const Note = require('../models/Note');
const Session = require('../models/Session');
const Video = require('../models/Video');

// Validation middleware for creating a note
const validateNote = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
];

// Validation middleware for creating a session
const validateSession = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('noteId').notEmpty().withMessage('Note ID is required'),
  body('conversation').notEmpty().withMessage('Conversation is required'),
];

// Validation middleware for creating a video
const validateVideo = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('youtubeUrl').isURL().withMessage('Valid YouTube URL is required'),
  body('summary').notEmpty().withMessage('Summary is required'),
];

const createNote = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, content } = req.body;
    const newNote = await Note.create({ title, content });
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create note', error: error.message });
  }
};

const createSession = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { userId, noteId, conversation } = req.body;
    
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    if (!noteId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid note ID format' });
    }
    
    const newSession = await Session.create({ userId, noteId, conversation });
    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create session', error: error.message });
  }
};

const createVideo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { userId, youtubeUrl, summary } = req.body;
    
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const newVideo = await Video.create({ userId, youtubeUrl, summary });
    res.status(201).json(newVideo);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save video info', error: error.message });
  }
};

module.exports = { createNote, createSession, createVideo, validateNote, validateSession, validateVideo };
