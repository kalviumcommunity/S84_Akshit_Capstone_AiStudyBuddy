const mongoose = require('mongoose');

const driveSourceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  driveLink: {
    type: String,
    required: true,
    trim: true
  },
  folderId: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSyncedAt: {
    type: Date,
    default: null
  },
  syncStatus: {
    type: String,
    enum: ['pending', 'syncing', 'completed', 'failed'],
    default: 'pending'
  },
  syncError: {
    type: String,
    default: null
  },
  filesProcessed: {
    type: Number,
    default: 0
  },
  syncedFiles: [{
    driveFileId: String,
    fileName: String,
    mimeType: String,
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note'
    },
    lastModified: Date,
    processedAt: Date
  }]
}, {
  timestamps: true
});

// Indexes
driveSourceSchema.index({ user: 1, isActive: 1 });
driveSourceSchema.index({ folderId: 1 });
driveSourceSchema.index({ lastSyncedAt: 1 });

const DriveSource = mongoose.model('DriveSource', driveSourceSchema);

module.exports = DriveSource;
