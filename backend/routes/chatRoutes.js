const express = require('express');
const { chatWithAI, chatWithContext } = require('../controllers/chatController');
const auth = require('../middleware/auth');

const router = express.Router();

// Basic chat endpoint
router.post('/chat', auth, chatWithAI);

// Chat with context (for file/video content)
router.post('/chat-context', auth, chatWithContext);

module.exports = router;