const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    validate: {
      validator: function(v) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: 'Invalid user ID format'
    }
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [1, 'Title cannot be empty']
  },
  youtubeUrl: {
    type: String,
    required: [true, 'YouTube URL is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(v);
      },
      message: 'Invalid YouTube URL format'
    }
  },
  videoId: {
    type: String,
    required: [true, 'Video ID is required'],
    unique: true,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9_-]{11}$/.test(v);
      },
      message: 'Invalid YouTube video ID format'
    }
  },
  thumbnailUrl: {
    type: String,
    required: [true, 'Thumbnail URL is required'],
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid thumbnail URL format'
    }
  },
  channelTitle: {
    type: String,
    required: [true, 'Channel title is required'],
    trim: true
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    validate: {
      validator: function(v) {
        return /^\d+:\d{2}$/.test(v);
      },
      message: 'Invalid duration format (should be MM:SS)'
    }
  },
  summary: {
    type: String,
    trim: true
  },
  notes: [{
    timestamp: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^\d+:\d{2}$/.test(v);
        },
        message: 'Invalid timestamp format (should be MM:SS)'
      }
    },
    content: {
      type: String,
      required: true,
      trim: true
    }
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
    } else {
      return next(new Error('Invalid YouTube URL format'));
    }
  }
  return next();
});

// Add indexes for better query performance
videoSchema.index({ user: 1, createdAt: -1 });
videoSchema.index({ tags: 1 });
videoSchema.index({ isPublic: 1 });
videoSchema.index({ videoId: 1 }, { unique: true });
videoSchema.index({ 'notes.timestamp': 1 });

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;

