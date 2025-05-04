const express = require('express');
const router = express.Router();
const { 
  validateNoteUpdate, 
  validateSessionUpdate, 
  validateVideoUpdate, 
  updateNote, 
  updateSession, 
  updateVideo 
} = require('../controllers/putController');

router.put('/notes/:id', validateNoteUpdate, updateNote);
router.put('/sessions/:id', validateSessionUpdate, updateSession);
router.put('/videos/:id', validateVideoUpdate, updateVideo);

module.exports = router; 