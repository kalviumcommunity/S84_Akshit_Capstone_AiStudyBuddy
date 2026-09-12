const express = require('express');
// Use regular chat controller (more stable)
const { chatWithAI, chatWithContext, submitFeedback } = require('../controllers/chatController');
const auth = require('../middleware/auth');

const router = express.Router();

// Basic chat endpoint (Groq + Llama)
router.post('/', auth, chatWithAI);

// Chat with context (RAG with LlamaIndex + Jina + Groq)
router.post('/context', auth, chatWithContext);

// Submit feedback for RAG responses
router.post('/feedback', auth, submitFeedback);

module.exports = router;