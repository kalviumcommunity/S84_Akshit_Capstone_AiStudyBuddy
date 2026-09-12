const Note = require('../models/Note');
const { body, validationResult } = require('express-validator');
const { Document } = require('llamaindex');
const { initializeLlamaIndex, createIndexFromText } = require('../utils/llamaIndexConfig');
const { embedText } = require('../utils/jinaEmbedding');

// Initialize LlamaIndex on module load
initializeLlamaIndex();

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

// Create a new note with LlamaIndex
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
    
    // Create the note first
    const newNote = await Note.create(noteData);
    
    console.log(`✅ Note created with ID: ${newNote._id}`);
    console.log(`🔄 Starting background LlamaIndex processing...`);
    
    // Send response immediately
    res.status(201).json({
      ...newNote.toObject(),
      message: 'Note created successfully. Indexing in progress...',
      indexing: true
    });
    
    // Process with LlamaIndex asynchronously (don't block response)
    setImmediate(async () => {
      try {
        await processNoteWithLlamaIndex(newNote._id, user, content, title);
      } catch (error) {
        console.error('❌ Background LlamaIndex processing failed:', error.message);
        console.error('   Note ID:', newNote._id);
        console.error('   Stack:', error.stack);
      }
    });
    
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

/**
 * Process note content with LlamaIndex (runs asynchronously)
 * @param {ObjectId} noteId - The note ID
 * @param {ObjectId} userId - The user ID
 * @param {string} content - The note content
 * @param {string} title - The note title
 */
async function processNoteWithLlamaIndex(noteId, userId, content, title) {
  try {
    console.log(`🔄 Processing note ${noteId} with LlamaIndex...`);
    console.log(`   Content length: ${content.length} characters`);
    console.log(`   Title: ${title}`);
    
    if (!content || content.trim().length === 0) {
      console.log('⚠️  No content to process (empty or whitespace only)');
      return;
    }
    
    // Create metadata for the document
    const metadata = {
      userId: userId.toString(),
      noteId: noteId.toString(),
      title: title,
      createdAt: new Date().toISOString(),
      wordCount: content.split(/\s+/).length
    };
    
    console.log(`📚 Creating LlamaIndex document with metadata:`, metadata);
    
    // Create LlamaIndex document
    const document = new Document({
      text: content,
      metadata: metadata
    });
    
    console.log(`🔄 Creating vector index with Jina embeddings...`);
    
    // Create index from document (this handles chunking, embedding, and storage)
    const index = await createIndexFromText(content, metadata);
    
    console.log(`✅ Successfully indexed note ${noteId} with LlamaIndex`);
    console.log(`   Embeddings: Jina AI (1024 dimensions)`);
    console.log(`   Storage: MongoDB vector store`);
    console.log(`   Chunks: Auto-generated by LlamaIndex (512 tokens, 50 overlap)`);
    console.log(`   ⏱️  Processing completed - note is now queryable!`);
    
  } catch (error) {
    console.error('❌ Error in processNoteWithLlamaIndex:', error.message);
    console.error('   Stack:', error.stack);
    throw error;
  }
}

// Delete a note
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid note ID format' });
    }
    
    const deletedNote = await Note.findByIdAndDelete(id);
    
    if (!deletedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // LlamaIndex vectors are stored in MongoDB with noteId in metadata
    // They will be filtered out during queries
    // Optional: Implement cleanup of vector store entries
    console.log(`✅ Note ${id} deleted (vector store entries remain but won't be queried)`);
    
    res.status(200).json({ 
      message: 'Note deleted successfully', 
      deletedNote 
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      error: 'Failed to delete note',
      message: error.message
    });
  }
};

module.exports = {
  getAllNotes,
  getNoteById,
  getNotesByUser,
  createNote,
  validateNote,
  deleteNote,
  processNoteWithLlamaIndex
};
