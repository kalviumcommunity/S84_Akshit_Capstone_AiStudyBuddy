const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Chat with Gemini AI
const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Create a chat session with enhanced instructions
    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 4000,
        temperature: 0.7,
      },
    });

    // Enhanced prompt that adapts to the type of message
    const enhancedPrompt = `You are a friendly AI study assistant. Respond naturally based on what the user says.

User's message: ${message}

IMPORTANT RULES:
- If the user says "hi", "hello", "hey" or similar greetings, respond with ONLY 1-2 short sentences like "Hi! How can I help you with your studies today?" or "Hello! What would you like to learn about?"
- For simple questions, give brief, direct answers (2-3 sentences max)
- ONLY provide detailed explanations when the user explicitly asks to "explain", "describe in detail", or asks complex academic questions
- Keep responses SHORT unless detail is specifically requested
- Be friendly but concise

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

// Chat with context (for file/video content)
const chatWithContext = async (req, res) => {
  try {
    const { message, context } = req.body;

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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Prepare the prompt with context
    let prompt = message;
    if (context && context.trim()) {
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
      prompt = `You are a friendly AI study assistant. Respond naturally based on what the user says.

Student's message: ${message}

IMPORTANT RULES:
- If it's a greeting (hi, hello, hey), respond with ONLY 1-2 short sentences
- For simple questions, give brief answers (2-3 sentences max)
- ONLY provide detailed explanations when explicitly asked to "explain", "describe", or for complex academic questions
- Keep responses SHORT unless detail is requested
- Be friendly but concise

Respond now:`;
    }

    // Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      message: text,
      success: true
    });

  } catch (error) {
    console.error('Chat with context error:', error);
    
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

module.exports = {
  chatWithAI,
  chatWithContext
};