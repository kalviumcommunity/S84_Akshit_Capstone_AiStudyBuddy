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
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional(),
  body('endTime').optional(),
  body('status').optional().isIn(['active', 'completed', 'paused']).withMessage('Status must be active, completed, or paused'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('content').optional().isArray().withMessage('Content must be an array'),
];

// Validation middleware for updating a video
const validateVideoUpdate = [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('youtubeUrl').optional().isURL().withMessage('Valid YouTube URL is required'),
  body('summary').optional().notEmpty().withMessage('Summary cannot be empty'),
  body('thumbnailUrl').optional(),
  body('channelTitle').optional(),
  body('duration').optional(),
  body('notes').optional().isArray().withMessage('Notes must be an array'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean')
];

const updateNote = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid note ID format' });
    }
    
    // Extract only allowed fields from the request body
    const { title, content, tags } = updateData;
    const sanitizedData = { title, content, tags };
    
    const updatedNote = await Note.findByIdAndUpdate(
      id, 
      sanitizedData, 
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
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid session ID format' });
    }
    
    // Extract only allowed fields from the request body
    const { title, description, endTime, status, tags, content, summary } = updateData;
    const sanitizedData = {};
    
    if (title) sanitizedData.title = title;
    if (description) sanitizedData.description = description;
    if (endTime) sanitizedData.endTime = new Date(endTime);
    if (status) sanitizedData.status = status;
    if (tags) sanitizedData.tags = tags;
    if (content) sanitizedData.content = content;
    if (summary) sanitizedData.summary = summary;
    
    const updatedSession = await Session.findByIdAndUpdate(
      id, 
      sanitizedData, 
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
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid video ID format' });
    }
    
    // Extract only allowed fields from the request body
    const { title, youtubeUrl, summary, notes, tags, thumbnailUrl, channelTitle, duration, isPublic } = updateData;
    const sanitizedData = {};
    
    if (title) sanitizedData.title = title;
    if (youtubeUrl) sanitizedData.youtubeUrl = youtubeUrl;
    if (summary) sanitizedData.summary = summary;
    if (notes) sanitizedData.notes = notes;
    if (tags) sanitizedData.tags = tags;
    if (thumbnailUrl) sanitizedData.thumbnailUrl = thumbnailUrl;
    if (channelTitle) sanitizedData.channelTitle = channelTitle;
    if (duration) sanitizedData.duration = duration;
    if (isPublic !== undefined) sanitizedData.isPublic = isPublic;
    
    const updatedVideo = await Video.findByIdAndUpdate(
      id, 
      sanitizedData, 
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