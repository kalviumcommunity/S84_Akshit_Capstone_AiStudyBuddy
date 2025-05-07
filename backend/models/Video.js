const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
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
  youtubeUrl: {
    type: String,
    required: true,
    trim: true
  },
  videoId: {
    type: String,
    required: true,
    unique: true
  },
  thumbnailUrl: {
    type: String,
    required: true
  },
  channelTitle: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    trim: true
  },
  notes: [{
    timestamp: String,
    content: String
  }],
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

// Extract video ID from YouTube URL before saving
videoSchema.pre('save', function(next) {
  if (this.isModified('youtubeUrl')) {
    const videoIdMatch = this.youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (videoIdMatch) {
      this.videoId = videoIdMatch[1];
    }
  }
  next();
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
