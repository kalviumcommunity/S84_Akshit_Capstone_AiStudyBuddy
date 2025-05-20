const Video = require('../models/Video');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Validation middleware for creating a video
const validateVideo = [
  body('user')
    .isMongoId().withMessage('Invalid user ID format')
    .notEmpty().withMessage('User ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('youtubeUrl')
    .isURL().withMessage('Valid URL is required')
    .matches(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
    .withMessage('Invalid YouTube URL format'),
  body('thumbnailUrl').notEmpty().withMessage('Thumbnail URL is required'),
];

// Create a new video (fixed version)
const createVideo = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { user, title, youtubeUrl, thumbnailUrl, channelTitle, duration, summary, tags } = req.body;
    
    // Extract video ID
    const videoIdMatch = youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (!videoIdMatch) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid YouTube URL format'
      });
    }
    const videoId = videoIdMatch[1];

    // Create video document
    const newVideo = await Video.create({
      user,
      title,
      youtubeUrl,
      videoId,
      thumbnailUrl,
      channelTitle: channelTitle || 'Unknown',
      duration: duration || '0:00',
      summary: summary || '',
      tags: Array.isArray(tags) ? tags : []
    });

    res.status(201).json({
      status: 'success',
      message: 'Video created successfully',
      video: newVideo
    });

  } catch (error) {
    console.error('Video creation error:', error);

    // Handle duplicate key error
    if (error.code === 11000 && error.keyValue?.videoId) {
      try {
        const existingVideo = await Video.findOne({ videoId: error.keyValue.videoId });
        return res.status(409).json({
          status: 'conflict',
          message: 'This YouTube video has already been added',
          existingVideo
        });
      } catch (findError) {
        console.error('Error finding existing video:', findError);
      }
    }

    // Handle validation errors from model
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    // Generic error handler
    res.status(500).json({
      status: 'error',
      message: 'Failed to save video info',
      error: error.message
    });
  }
};

// Get all videos
const getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.status(200).json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({
      error: 'Failed to fetch videos',
      message: error.message
    });
  }
};

// Get video by ID
const getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.status(200).json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({
      error: 'Failed to fetch video',
      message: error.message
    });
  }
};

// Get videos by user ID
const getVideosByUser = async (req, res) => {
  try {
    const videos = await Video.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(videos);
  } catch (error) {
    console.error('Error fetching user videos:', error);
    res.status(500).json({
      error: 'Failed to fetch user videos',
      message: error.message
    });
  }
};

// Delete a video
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid video ID format' });
    }
    
    const deletedVideo = await Video.findByIdAndDelete(id);
    
    if (!deletedVideo) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    res.status(200).json({ message: 'Video deleted successfully', deletedVideo });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      error: 'Failed to delete video',
      message: error.message
    });
  }
};

// Get the latest video
const getLatestVideo = async (req, res) => {
  try {
    const latestVideo = await Video.findOne()
      .sort({ createdAt: -1 })
      .limit(1);

    if (!latestVideo) {
      return res.status(404).json({
        status: 'error',
        message: 'No videos found'
      });
    }

    res.status(200).json({
      status: 'success',
      video: latestVideo
    });
  } catch (error) {
    console.error('Error getting latest video:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get latest video',
      error: error.message
    });
  }
};

module.exports = {
  getAllVideos,
  getVideoById,
  getVideosByUser,
  createVideo,
  validateVideo,
  deleteVideo,
  getLatestVideo
};