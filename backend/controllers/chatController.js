const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');
const Chunk = require('../models/Chunk');
const { getEmbedding } = require('../utils/embedding'); // Use fallback vectors (free)
const { findTopSimilar } = require('../utils/similarity');
const cache = require('../utils/cache');
const apiKeyManager = require('../utils/apiKeyManager');

// Initialize Gemini AI with key rotation
function getGenAI() {
  const apiKey = apiKeyManager.getNextKey();
  return new GoogleGenerativeAI(apiKey);
}

// Chat with Gemini AI
const chatWithAI = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Gemini API key is not configured' 
      });
    }

    // Get the generative model
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    // Prepare conversation history
    let chatHistory = [];
    if (history && Array.isArray(history) && history.length > 0) {
      // Filter and validate history
      let validHistory = history.slice(-20); // Limit to last 20 messages
      
      // Ensure first message is from user, if not, remove leading model messages
      while (validHistory.length > 0 && validHistory[0].role !== 'user') {
        validHistory.shift();
      }
      
      // Ensure messages alternate between user and model
      const alternatingHistory = [];
      let lastRole = null;
      for (const msg of validHistory) {
        if (msg.role !== lastRole) {
          alternatingHistory.push(msg);
          lastRole = msg.role;
        }
      }
      
      chatHistory = alternatingHistory;
    }

    // Create a chat session with conversation history
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 4000,
        temperature: 0.7,
      },
    });

    // Enhanced prompt that adapts to the type of message
    const enhancedPrompt = `You are a friendly AI study assistant. Respond naturally based on what the user says and the conversation context.

User's message: ${message}

IMPORTANT RULES:
- If the user says "hi", "hello", "hey" or similar greetings, respond with ONLY 1-2 short sentences like "Hi! How can I help you with your studies today?" or "Hello! What would you like to learn about?"
- For simple questions, give brief, direct answers (2-3 sentences max)
- If the user asks follow-up questions or says "yes" to continue a topic, provide the detailed explanation they're asking for based on the previous conversation
- ONLY provide detailed explanations when the user explicitly asks to "explain", "describe in detail", asks complex academic questions, or confirms they want more information
- Keep responses SHORT unless detail is specifically requested or it's a follow-up to a previous topic
- Be friendly but concise
- Remember the conversation context and build on previous messages

Respond now:`;

    // Send message and get response
    const result = await chat.sendMessage(enhancedPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      message: text,
      success: true
    });

  } catch (error) {
    console.error('Chat error:', error);
    
    // Handle specific Gemini API errors
    if (error.message?.includes('API_KEY_INVALID')) {
      return res.status(401).json({
        error: 'Invalid Gemini API key'
      });
    }
    
    if (error.message?.includes('QUOTA_EXCEEDED')) {
      return res.status(429).json({
        error: 'API quota exceeded. Please try again later.'
      });
    }

    res.status(500).json({
      error: 'Failed to get AI response',
      message: error.message
    });
  }
};

// Chat with context (for file/video content) - NOW WITH RAG
const chatWithContext = async (req, res) => {
  // Declare variables outside try block so they're accessible in catch
  let useRAG = false;
  let retrievedContext = '';
  
  try {
    const { message, context, noteId, userId } = req.body;

    console.log('📨 Chat with context request received');
    console.log(`   Message: "${message?.substring(0, 50)}..."`);
    console.log(`   NoteId: ${noteId || 'null'}`);
    console.log(`   UserId: ${userId || 'null'}`);
    console.log(`   Context provided: ${context ? 'Yes' : 'No'}`);

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Gemini API key is not configured' 
      });
    }

    // Get the generative model
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    let prompt = message;

    // Try RAG if noteId or userId is provided
    if (noteId || userId) {
      console.log('🎯 Attempting RAG retrieval...');
      try {
        const ragResult = await retrieveRelevantChunks(message, noteId, userId);
        
        if (ragResult && ragResult.context) {
          retrievedContext = ragResult.context;
          const avgSimilarity = ragResult.avgSimilarity;
          
          // Check if similarity is high enough (threshold: 0.75 - strict for better accuracy)
          if (avgSimilarity >= 0.75) {
            useRAG = true;
            console.log(`✅ Using RAG with retrieved context (avg similarity: ${avgSimilarity.toFixed(2)})`);
          } else {
            console.log(`⚠️  Low similarity (${avgSimilarity.toFixed(2)}), falling back to Gemini general knowledge`);
            retrievedContext = ''; // Clear context to use general knowledge
          }
        } else {
          console.log('⚠️  No relevant context found, falling back to Gemini general knowledge');
        }
      } catch (ragError) {
        console.error('❌ RAG retrieval error, falling back to general knowledge:', ragError.message);
        // Continue with fallback
      }
    } else {
      console.log('ℹ️  No noteId or userId provided, skipping RAG');
    }

    // Build prompt based on available context
    if (useRAG && retrievedContext) {
      // RAG mode: Use retrieved chunks
      prompt = `You are a friendly AI study assistant. Answer using the context provided below.

Context from notes:
${retrievedContext}

Student's question: ${message}

RULES:
- Answer based on the context above
- Keep answers concise unless detail is requested
- Be clear and direct

Respond now:`;
    } else if (context && context.trim()) {
      // Fallback mode: Use provided context (legacy support)
      prompt = `You are a friendly AI study assistant. Answer based on the context provided.

Context: ${context}

Student's question: ${message}

RULES:
- Keep answers concise unless detail is requested
- Use the context to give accurate answers
- Only elaborate when the question requires it
- Be clear and direct

Respond now:`;
    } else {
      // No context mode: Use Gemini's general knowledge
      prompt = `You are a friendly AI study assistant with access to general knowledge. The user asked a question but no relevant information was found in their uploaded notes.

Student's question: ${message}

IMPORTANT RULES:
- Answer using your general knowledge since no relevant notes were found
- If it's a greeting (hi, hello, hey), respond with ONLY 1-2 short sentences
- For simple questions, give brief answers (2-3 sentences max)
- ONLY provide detailed explanations when explicitly asked to "explain", "describe", or for complex academic questions
- Keep responses SHORT unless detail is requested
- Be friendly but concise
- You can mention that this answer is from general knowledge, not their notes

Respond now:`;
    }

    // Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      message: text,
      success: true,
      usedRAG: useRAG,
      fallbackToGeneral: !useRAG && (noteId || userId) // Indicates we fell back to general knowledge
    });

  } catch (error) {
    console.error('Chat with context error:', error);
    
    // Handle specific Gemini API errors
    if (error.message?.includes('API_KEY_INVALID')) {
      return res.status(401).json({
        error: 'Invalid Gemini API key'
      });
    }
    
    if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('429')) {
      return res.status(429).json({
        error: 'API quota exceeded. Please try again later.'
      });
    }
    
    // If Gemini fails (503, 403, etc.) but we have RAG context, return it directly
    if ((error.message?.includes('503') || error.message?.includes('403') || error.message?.includes('denied access')) && useRAG && retrievedContext) {
      console.log('⚠️  Gemini API unavailable, returning raw context');
      return res.json({
        message: `I found this information in your notes:\n\n${retrievedContext}\n\n---\n⚠️ Note: AI summarization is currently unavailable. Please update your Gemini API keys.`,
        success: true,
        usedRAG: true,
        fallback: true
      });
    }

    res.status(500).json({
      error: 'Failed to get AI response',
      message: error.message
    });
  }
};

/**
 * Retrieve relevant chunks using RAG with optional vector search
 * @param {string} query - User's question
 * @param {string} noteId - Optional note ID to filter chunks
 * @param {string} userId - Optional user ID to filter chunks
 * @returns {Promise<Object>} Object with context string and average similarity
 */
async function retrieveRelevantChunks(query, noteId, userId) {
  try {
    console.log('🔍 RAG Retrieval Started');
    console.log(`   Query: "${query.substring(0, 100)}..."`);
    console.log(`   NoteId: ${noteId || 'null'}`);
    console.log(`   UserId: ${userId || 'null'}`);
    
    // Check cache first
    const cacheKey = cache.ragKey(query, noteId || userId);
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log('✓ RAG cache hit');
      return cached;
    }

    // Generate embedding for the query
    console.log('🔄 Generating query embedding...');
    const queryEmbedding = await getEmbedding(query);
    console.log('✓ Query embedding generated');

    // Build filter for chunks
    const filter = {};
    if (noteId) {
      filter.noteId = noteId;
      console.log(`   Filtering by noteId: ${noteId}`);
    } else if (userId) {
      filter.userId = userId;
      console.log(`   Filtering by userId: ${userId}`);
    }

    // Try vector search first (if Atlas Search is configured)
    // Falls back to manual similarity if vector search not available
    let chunks;
    try {
      chunks = await vectorSearch(queryEmbedding, filter, 5);
      console.log(`✓ Vector search returned ${chunks.length} chunks`);
    } catch (vectorError) {
      console.log('⚠️  Vector search not available, using manual similarity');
      console.log(`   Error: ${vectorError.message}`);
      // Fallback to manual similarity search
      chunks = await Chunk.find(filter).lean();
      console.log(`✓ Found ${chunks.length} chunks from database`);
    }

    if (!chunks || chunks.length === 0) {
      console.log('❌ No chunks found for query');
      console.log('   This usually means:');
      console.log('   1. Chunks are still being processed (wait 15-20 seconds after upload)');
      console.log('   2. The noteId does not exist in database');
      console.log('   3. Chunks failed to save (check earlier logs)');
      return null;
    }

    console.log(`📊 Processing ${chunks.length} chunks for similarity...`);

    // If we got results from vector search, they're already sorted
    // Otherwise, calculate similarity manually
    let topChunks;
    if (chunks[0].score !== undefined) {
      // Vector search results (already sorted)
      topChunks = chunks.map(chunk => ({
        similarity: chunk.score,
        data: chunk
      }));
      console.log('✓ Using vector search scores');
    } else {
      // Manual similarity calculation
      const chunkItems = chunks.map(chunk => ({
        embedding: chunk.embedding,
        data: chunk
      }));
      topChunks = findTopSimilar(queryEmbedding, chunkItems, 5, 0.2); // Lowered threshold to 0.2 for better recall
      console.log('✓ Manual similarity calculated');
    }

    if (topChunks.length === 0) {
      console.log('❌ No chunks met similarity threshold');
      return null;
    }

    // Calculate average similarity
    const avgSimilarity = topChunks.reduce((sum, item) => sum + item.similarity, 0) / topChunks.length;

    console.log(`✅ Retrieved ${topChunks.length} relevant chunks (avg similarity: ${avgSimilarity.toFixed(4)})`);
    topChunks.forEach((item, i) => {
      const keywords = item.data.metadata?.keywords?.join(', ') || 'none';
      console.log(`   Chunk ${i + 1}: Similarity ${item.similarity.toFixed(4)}, Words: ${item.data.metadata?.wordCount || 'N/A'}, Keywords: ${keywords}`);
      console.log(`   Preview: ${item.data.text.substring(0, 150)}...`);
    });

    // Build context string from top chunks
    const contextParts = topChunks.map((item, index) => {
      return `[Chunk ${index + 1}] ${item.data.text}`;
    });

    const context = contextParts.join('\n\n');
    
    console.log(`📝 Context length: ${context.length} characters`);
    console.log(`📝 Context preview: ${context.substring(0, 300)}...`);
    
    const result = {
      context,
      avgSimilarity,
      chunkCount: topChunks.length
    };
    
    // Cache the result (5 minutes TTL for RAG queries)
    await cache.set(cacheKey, result, 300);
    console.log('✓ Context cached');
    
    return result;
  } catch (error) {
    console.error('❌ Error retrieving chunks:', error.message);
    console.error('   Stack:', error.stack);
    throw error;
  }
}

/**
 * Vector search using MongoDB Atlas Search (if configured)
 * @param {Array<number>} queryVector - Query embedding vector
 * @param {Object} filter - MongoDB filter object
 * @param {number} limit - Number of results to return
 * @returns {Promise<Array>} Search results with scores
 */
async function vectorSearch(queryVector, filter, limit = 5) {
  // MongoDB Atlas Vector Search aggregation pipeline
  const pipeline = [
    {
      $search: {
        index: "vector_index", // Must be created in Atlas UI
        knnBeta: {
          vector: queryVector,
          path: "embedding",
          k: limit * 2, // Get more candidates for filtering
          filter: filter // Apply noteId/userId filter
        }
      }
    },
    {
      $addFields: {
        score: { $meta: "searchScore" }
      }
    },
    {
      $limit: limit
    }
  ];

  const results = await Chunk.aggregate(pipeline);
  return results;
}

module.exports = {
  chatWithAI,
  chatWithContext
};

// Submit feedback for RAG responses
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

    console.log(`Feedback saved: ${rating} for ${usedRAG ? 'RAG' : 'regular'} response`);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: feedback._id
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
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
