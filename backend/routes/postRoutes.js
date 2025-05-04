const express = require('express');
const router = express.Router();
const { createNote, createSession, createVideo, validateNote, validateSession, validateVideo } = require('../controllers/postController');

router.post('/notes', validateNote, createNote);
router.post('/sessions', validateSession, createSession);
router.post('/videos', validateVideo, createVideo);

module.exports = router;
