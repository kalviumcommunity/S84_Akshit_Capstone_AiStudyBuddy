const { generateResponse, generateWithHistory, generateWithContext } = require('../utils/groqClient');
const { queryIndex } = require('../utils/llamaIndexConfig');
const cache = require('../utils/cache');

/**
 * Chat Controller using LlamaIndex + Jina + Groq
 * - Retrieval: LlamaIndex with Jina embeddings
 * - Generation: Groq with Llama 3.1 70B
 */

// Simple chat without context (general conversation)
const chatWithAI = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }

    console.log('💬 General chat request (no RAG)');
    console.log(`   Message: "${message.substring(0, 50)}..."`);

    // Check if Groq API is configured
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ 
        error: 'Groq API key is not configured' 
      });
    }

    let response;

    // If history provided, use conversation mode
    if (history && Array.isArray(history) && history.length > 0) {
      console.log(`   Using conversation history (${history.length} messages)`);
      
      // Prepare messages for Groq
      const messages = [
        { role: 'system', content: 'You are a friendly AI study assistant.' },
        ...history.slice(-10), // Last 10 messages
        { role: 'user', content: message }
      ];
      
      response = await generateWithHistory(messages);
    } else {
      // Simple single-turn conversation
      const systemPrompt = `You are a friendly AI study assistant. 

IMPORTANT RULES:
- If the user says "hi", "hello", "hey" or similar greetings, respond with ONLY 1-2 short sentences
- For simple questions, give brief, direct answers (2-3 sentences max)
- ONLY provide detailed explanations when explicitly asked or for complex academic questions
- Be friendly but concise`;

      response = await generateResponse(message, { systemPrompt });
    }

    res.json({
      message: response,
      success: true,
      model: 'groq-llama-3.1-70b'
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    
    // Handle specific Groq API errors
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('401')) {
      return res.status(401).json({
        error: 'Invalid Groq API key'
      });
    }
    
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      return res.status(429).json({
        error: 'API rate limit exceeded. Please try again later.'
      });
    }

    res.status(500).json({
      error: 'Failed to get AI response',
      message: error.message
    });
  }
};

// Chat with RAG context using LlamaIndex
const chatWithContext = async (req, res) => {
  try {
    const { message, noteId, userId } = req.body;

    console.log('📨 RAG chat request received');
    console.log(`   Message: "${message?.substring(0, 50)}..."`);
    console.log(`   NoteId: ${noteId || 'null'}`);
    console.log(`   UserId: ${userId || 'null'}`);

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }

    // Check if Groq API is configured
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ 
        error: 'Groq API key is not configured' 
      });
    }

    // If no noteId or userId, fall back to general chat
    if (!noteId && !userId) {
      console.log('ℹ️  No noteId or userId provided, using general chat');
      return chatWithAI(req, res);
    }

    // Check cache first
    const cacheKey = cache.ragKey(message, noteId || userId);
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log('✓ RAG cache hit');
      return res.json({
        message: cached.response,
        success: true,
        usedRAG: true,
        cached: true,
        model: 'groq-llama-3.1-70b'
      });
    }

    // Build filter for LlamaIndex query
    const filter = {};
    if (noteId) {
      filter.noteId = noteId;
      console.log(`   Filtering by noteId: ${noteId}`);
    } else if (userId) {
      filter.userId = userId;
      console.log(`   Filtering by userId: ${userId}`);
    }

    console.log('🔍 Querying LlamaIndex...');

    // Query LlamaIndex (handles retrieval + generation)
    let queryResult;
    try {
      queryResult = await queryIndex(message, filter, 5);
    } catch (queryError) {
      console.error('❌ LlamaIndex query error:', queryError.message);
      
      // Fallback to general chat if query fails
      console.log('⚠️  Falling back to general chat (no RAG)');
      return chatWithAI(req, res);
    }

    if (!queryResult || !queryResult.response) {
      console.log('⚠️  No results from LlamaIndex, using general chat');
      return chatWithAI(req, res);
    }

    console.log('✅ LlamaIndex query successful');
    console.log(`   Retrieved ${queryResult.sourceNodes?.length || 0} source nodes`);

    // Cache the result
    await cache.set(cacheKey, {
      response: queryResult.response,
      sourceNodes: queryResult.sourceNodes
    }, 300); // 5 minutes TTL

    res.json({
      message: queryResult.response,
      success: true,
      usedRAG: true,
      sourceCount: queryResult.sourceNodes?.length || 0,
      model: 'groq-llama-3.1-70b',
      embeddings: 'jina-ai'
    });

  } catch (error) {
    console.error('❌ Chat with context error:', error);
    
    // Handle specific errors
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('401')) {
      return res.status(401).json({
        error: 'Invalid Groq API key'
      });
    }
    
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      return res.status(429).json({
        error: 'API rate limit exceeded. Please try again later.'
      });
    }

    res.status(500).json({
      error: 'Failed to get AI response',
      message: error.message
    });
  }
};

// Submit feedback for responses
const submitFeedback = async (req, res) => {
  try {
    const { userId, noteId, query, response, rating, usedRAG } = req.body;

    if (!userId || !query || !response || !rating) {
      return res.status(400).json({
        error: 'Missing required fields: userId, query, response, rating'
      });
    }

    if (!['positive', 'negative'].includes(rating)) {
      return res.status(400).json({
        error: 'Rating must be either "positive" or "negative"'
      });
    }

    const Feedback = require('../models/Feedback');

    const feedback = await Feedback.create({
      userId,
      noteId: noteId || null,
      query,
      response,
      rating,
      usedRAG: usedRAG || false
    });

    console.log(`✅ Feedback saved: ${rating} for ${usedRAG ? 'RAG' : 'regular'} response`);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: feedback._id
    });

  } catch (error) {
    console.error('❌ Feedback submission error:', error);
    res.status(500).json({
      error: 'Failed to submit feedback',
      message: error.message
    });
  }
};

module.exports = {
  chatWithAI,
  chatWithContext,
  submitFeedback
};
