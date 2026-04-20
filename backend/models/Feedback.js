const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    required: false
  },
  query: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: true
  },
  rating: {
    type: String,
    enum: ['positive', 'negative'],
    required: true
  },
  usedRAG: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Add indexes
feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ noteId: 1 });
feedbackSchema.index({ rating: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
