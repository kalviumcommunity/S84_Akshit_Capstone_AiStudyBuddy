const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'text'],
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number, // Size in bytes
    required: true
  },
  summary: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
noteSchema.index({ user: 1, createdAt: -1 });
noteSchema.index({ tags: 1 });
noteSchema.index({ isPublic: 1 });
noteSchema.index({ fileType: 1 });

// TTL index: Automatically delete notes after 7 days (604800 seconds)
// MongoDB will delete documents where createdAt is older than 7 days
noteSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
