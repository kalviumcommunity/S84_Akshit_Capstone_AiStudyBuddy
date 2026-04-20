const Note = require('../models/Note');
const Chunk = require('../models/Chunk');
const { body, validationResult } = require('express-validator');
const { chunkText } = require('../utils/chunkText');
const { getEmbedding, getEmbeddings } = require('../utils/embedding'); // Use fallback vectors (free)

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
    
    // Create the note first
    const newNote = await Note.create(noteData);
    
    // Process chunks and embeddings asynchronously (don't block response)
    // This runs in background after note is created
    console.log(`📝 Note created: ${newNote._id}, starting background chunk processing...`);
    
    // Start background processing but don't await it
    setImmediate(async () => {
      try {
        await processNoteChunks(newNote._id, user, content);
      } catch (error) {
        console.error('❌ Background chunk processing failed:', error.message);
        console.error('   Note ID:', newNote._id);
        console.error('   Stack:', error.stack);
      }
    });
    
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

/**
 * Process note content into chunks with embeddings (runs asynchronously)
 * @param {ObjectId} noteId - The note ID
 * @param {ObjectId} userId - The user ID
 * @param {string} content - The note content
 */
async function processNoteChunks(noteId, userId, content) {
  try {
    console.log(`🔄 Processing chunks for note ${noteId}...`);
    console.log(`   Content length: ${content.length} characters`);
    
    // Split content into chunks
    const chunks = chunkText(content, 400, 50);
    
    if (chunks.length === 0) {
      console.log('⚠️  No chunks generated for note (content too short or empty)');
      return;
    }
    
    console.log(`✓ Generated ${chunks.length} chunks`);
    
    // Generate embeddings for all chunks (with delay to avoid rate limits)
    console.log('🔄 Generating embeddings...');
    const embeddings = [];
    let failedCount = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await getEmbedding(chunks[i]);
        embeddings.push(embedding);
        console.log(`   ✓ Embedding ${i + 1}/${chunks.length} generated`);
        
        // Add delay between requests to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      } catch (error) {
        failedCount++;
        console.error(`   ⚠️  Failed to generate embedding ${i + 1}:`, error.message);
        // Don't throw - use fallback vector instead
        const fallbackEmbedding = await getEmbedding(chunks[i]); // Will use createSimpleVector fallback
        embeddings.push(fallbackEmbedding);
        console.log(`   ✓ Using fallback vector for chunk ${i + 1}`);
      }
    }
    
    console.log(`✓ All ${embeddings.length} embeddings generated (${failedCount} used fallback)`);
    
    if (embeddings.length !== chunks.length) {
      throw new Error(`Embedding count mismatch: ${embeddings.length} vs ${chunks.length}`);
    }
    
    // Prepare chunk documents
    const chunkDocuments = chunks.map((text, index) => {
      // Extract keywords (words longer than 4 chars, top 5)
      const words = text.toLowerCase().match(/\b\w{5,}\b/g) || [];
      const wordFreq = {};
      words.forEach(w => wordFreq[w] = (wordFreq[w] || 0) + 1);
      const keywords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);
      
      return {
        text,
        embedding: embeddings[index],
        noteId,
        userId,
        metadata: {
          chunkIndex: index,
          totalChunks: chunks.length,
          wordCount: text.split(/\s+/).length,
          fileType: 'text',
          sourceFileName: '',
          keywords: keywords
        }
      };
    });
    
    // Insert all chunks into database
    console.log(`💾 Inserting ${chunkDocuments.length} chunks into database...`);
    await Chunk.insertMany(chunkDocuments);
    
    console.log(`✅ Successfully stored ${chunkDocuments.length} chunks for note ${noteId}`);
    console.log(`   Total words processed: ${chunkDocuments.reduce((sum, c) => sum + c.metadata.wordCount, 0)}`);
    console.log(`   ⏱️  Processing completed - chunks are now queryable!`);
  } catch (error) {
    console.error('❌ Error in processNoteChunks:', error.message);
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
    
    // Also delete associated chunks
    await Chunk.deleteMany({ noteId: id });
    console.log(`Deleted chunks for note ${id}`);
    
    res.status(200).json({ message: 'Note deleted successfully', deletedNote });
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
  processNoteChunks
}; 