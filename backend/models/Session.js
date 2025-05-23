const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
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
  description: {
    type: String,
    trim: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // Duration in minutes
    default: 0
  },
  content: [{
    type: {
      type: String,
      enum: ['Note', 'Video'],
      required: true
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'content.type'
    }
  }],
  summary: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Calculate duration when session ends
studySessionSchema.pre('save', function(next) {
  if (this.isModified('endTime') && this.endTime) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60)); // Convert to minutes
  }
  next();
});

// Add indexes for better query performance
studySessionSchema.index({ user: 1, createdAt: -1 });
studySessionSchema.index({ status: 1 });
studySessionSchema.index({ tags: 1 });
studySessionSchema.index({ startTime: 1 });
studySessionSchema.index({ 'content.contentId': 1 });

const StudySession = mongoose.model('StudySession', studySessionSchema);

module.exports = StudySession;
