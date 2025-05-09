const Note = require('../models/Note');
const { body, validationResult } = require('express-validator');

// Validation middleware for creating a note
const validateNote = [
  body('user').notEmpty().withMessage('User ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('fileType').notEmpty().isIn(['pdf', 'text']).withMessage('File type must be pdf or text'),
  body('fileUrl').notEmpty().withMessage('File URL is required'),
  body('originalFileName').notEmpty().withMessage('Original file name is required'),
  body('fileSize').notEmpty().isNumeric().withMessage('File size is required and must be a number'),
];

// Get all notes
const getAllNotes = async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.status(200).json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      error: 'Failed to fetch notes',
      message: error.message
    });
  }
};

// Get note by ID
const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(200).json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({
      error: 'Failed to fetch note',
      message: error.message
    });
  }
};

// Get notes by user ID
const getNotesByUser = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(notes);
  } catch (error) {
    console.error('Error fetching user notes:', error);
    res.status(500).json({
      error: 'Failed to fetch user notes',
      message: error.message
    });
  }
};

// Create a new note
const createNote = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { user, title, content, fileType, fileUrl, originalFileName, fileSize, summary, tags, isPublic } = req.body;
    
    if (!user.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const noteData = {
      user,
      title,
      content,
      fileType,
      fileUrl,
      originalFileName,
      fileSize
    };
    
    // Add optional fields if they exist
    if (summary) noteData.summary = summary;
    if (tags && Array.isArray(tags)) noteData.tags = tags;
    if (isPublic !== undefined) noteData.isPublic = isPublic;
    
    const newNote = await Note.create(noteData);
    return res.status(201).json(newNote);
  } catch (error) {
    console.error("Note creation error:", error);
    
    // Check for duplicate key error
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(409).json({
        message: 'This note already exists',
        error: 'Duplicate note'
      });
    }
    
    return res.status(500).json({ 
      message: 'Failed to create note', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllNotes,
  getNoteById,
  getNotesByUser,
  createNote,
  validateNote
}; 