const express = require('express');
const router = express.Router();
const { createNote, createSession, createVideo } = require('../controllers/postController');

router.post('/notes', createNote);
router.post('/sessions', createSession);
router.post('/videos', createVideo);

module.exports = router;
