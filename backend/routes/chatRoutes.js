const express = require('express');
const { chatWithAI, chatWithContext, submitFeedback } = require('../controllers/chatController');
const auth = require('../middleware/auth');

const router = express.Router();

// Basic chat endpoint
router.post('/', auth, chatWithAI);

// Chat with context (for file/video content) - RAG enabled
router.post('/context', auth, chatWithContext);

// Submit feedback for RAG responses
router.post('/feedback', auth, submitFeedback);

module.exports = router;