const { body, validationResult } = require('express-validator');
const Note = require('../models/Note');
const Session = require('../models/Session');
const Video = require('../models/Video');

// Validation middleware for updating a note
const validateNoteUpdate = [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
];

// Validation middleware for updating a session
const validateSessionUpdate = [
  body('userId').optional().notEmpty().withMessage('User ID cannot be empty'),
  body('noteId').optional().notEmpty().withMessage('Note ID cannot be empty'),
  body('conversation').optional().notEmpty().withMessage('Conversation cannot be empty'),
];

// Validation middleware for updating a video
const validateVideoUpdate = [
  body('userId').optional().notEmpty().withMessage('User ID cannot be empty'),
  body('youtubeUrl').optional().isURL().withMessage('Valid YouTube URL is required'),
  body('summary').optional().notEmpty().withMessage('Summary cannot be empty'),
];

const updateNote = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedNote = await Note.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    res.status(200).json(updatedNote);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update note', error: error.message });
  }
};

const updateSession = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedSession = await Session.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!updatedSession) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    res.status(200).json(updatedSession);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update session', error: error.message });
  }
};

const updateVideo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedVideo = await Video.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!updatedVideo) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    res.status(200).json(updatedVideo);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update video', error: error.message });
  }
};

module.exports = { 
  validateNoteUpdate, 
  validateSessionUpdate, 
  validateVideoUpdate, 
  updateNote, 
  updateSession, 
  updateVideo 
}; 