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

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
