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

    // Enhanced prompt for more detailed responses
    const enhancedPrompt = `You are an expert AI study assistant and tutor. Your role is to provide comprehensive, detailed, and educational responses that help students learn effectively.

User's question: ${message}

Instructions for your response:
- Provide thorough, detailed explanations that cover all important aspects of the topic
- For technical topics (like OSI model, networking, programming, etc.), include:
  * Complete definitions and explanations
  * All relevant components, layers, or parts
  * Examples and real-world applications
  * Step-by-step breakdowns when appropriate
- Use clear, educational language that's easy to understand
- Structure your response with proper organization (use headings, bullet points, or numbered lists when helpful)
- Include practical examples and analogies to make concepts clearer
- Provide additional context that enhances understanding
- Be conversational but comprehensive
- Avoid excessive markdown formatting, but use basic formatting for clarity
- If the topic has multiple parts or layers (like OSI model's 7 layers), make sure to cover ALL of them in detail

Please provide a comprehensive, educational response that thoroughly addresses the question:`;

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
      prompt = `You are an expert AI study assistant. Please provide a comprehensive, detailed response based on the context provided.

Context: ${context}

Student's question: ${message}

Instructions:
- Provide thorough explanations that fully address the question
- Use the context to give specific, detailed answers
- Include examples and practical applications when relevant
- Structure your response clearly with proper organization
- Be educational and comprehensive
- If the context contains technical information, explain it in detail
- Make connections between different concepts when appropriate

Please provide a detailed, educational response:`;
    } else {
      prompt = `You are an expert AI study assistant and tutor. Please provide a comprehensive, detailed, and educational response.

Student's question: ${message}

Instructions:
- Provide thorough, detailed explanations that cover all important aspects
- For technical topics, include complete definitions, components, and examples
- Use clear, educational language with proper structure
- Include practical examples and real-world applications
- Be comprehensive and educational
- Cover all relevant parts of the topic (e.g., if asked about OSI model, cover all 7 layers in detail)

Please provide a comprehensive response:`;
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