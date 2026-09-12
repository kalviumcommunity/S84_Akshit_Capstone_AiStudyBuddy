const mongoose = require('mongoose');

// Schema for storing text chunks with embeddings for RAG
const chunkSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    required: true
  },
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // NEW: Metadata for better retrieval and filtering
  metadata: {
    chunkIndex: {
      type: Number,
      default: 0
    },
    totalChunks: {
      type: Number,
      default: 1
    },
    wordCount: {
      type: Number,
      default: 0
    },
    fileType: {
      type: String,
      enum: ['pdf', 'text', 'image', 'youtube'],
      default: 'text'
    },
    sourceFileName: {
      type: String,
      default: ''
    },
    keywords: [{
      type: String
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
chunkSchema.index({ noteId: 1 });
chunkSchema.index({ userId: 1 });
chunkSchema.index({ createdAt: -1 });
chunkSchema.index({ 'metadata.keywords': 1 });
chunkSchema.index({ 'metadata.fileType': 1 });

// Compound index for common queries
chunkSchema.index({ userId: 1, noteId: 1 });

// TTL index: Automatically delete chunks after 7 days (604800 seconds)
// MongoDB will delete documents where createdAt is older than 7 days
chunkSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

// Note: Vector search index must be created in MongoDB Atlas UI
// Go to: Atlas → Database → Search → Create Search Index
// Index name: "vector_index"
// Field: "embedding"
// Type: "knnVector"
// Dimensions: 768
// Similarity: "cosine"

const Chunk = mongoose.model('Chunk', chunkSchema);

module.exports = Chunk;
