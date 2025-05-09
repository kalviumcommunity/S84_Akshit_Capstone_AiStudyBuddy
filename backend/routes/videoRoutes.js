const express = require('express');
const router = express.Router();
const { getAllVideos, getVideoById, getVideosByUser, createVideo, validateVideo, deleteVideo } = require('../controllers/videoController');
const { updateVideo, validateVideoUpdate } = require('../controllers/putController');

// GET /api/videos - Get all videos
router.get('/', getAllVideos);

// GET /api/videos/user/:userId - Get videos by user ID
router.get('/user/:userId', getVideosByUser);

// GET /api/videos/:id - Get a specific video by ID
router.get('/:id', getVideoById);

// POST /api/videos - Create a new video
router.post('/', validateVideo, createVideo);

// PUT /api/videos/:id - Update a video
router.put('/:id', validateVideoUpdate, updateVideo);

// DELETE /api/videos/:id - Delete a video
router.delete('/:id', deleteVideo);

module.exports = router; 