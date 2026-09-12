const Groq = require('groq-sdk');

/**
 * Groq API Client for Llama Models
 * Free tier: 14,400 requests/day, 30 requests/minute
 */

// Available Llama models on Groq
const MODELS = {
  LLAMA_3_3_70B: 'llama-3.3-70b-versatile',
  LLAMA_3_1_8B: 'llama-3.1-8b-instant',
  LLAMA_3_2_3B: 'llama-3.2-3b-preview'
};

// Default model - best balance of speed and quality
const DEFAULT_MODEL = MODELS.LLAMA_3_3_70B;

/**
 * Get Groq client instance
 * @returns {Groq} Groq client
 */
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured in environment variables');
  }
  
  return new Groq({ apiKey });
}

/**
 * Generate chat completion using Groq + Llama
 * @param {string} prompt - User prompt or system + user messages
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Generated response
 */
async function generateResponse(prompt, options = {}) {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 4000,
    systemPrompt = 'You are a helpful AI study assistant.'
  } = options;

  try {
    console.log(`🤖 Generating response with Groq (${model})...`);
    
    const groq = getGroqClient();
    
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      model: model,
      temperature: temperature,
      max_tokens: maxTokens,
      top_p: 1,
      stream: false
    });

    const response = completion.choices[0]?.message?.content || '';
    
    console.log(`✅ Groq response generated (${response.length} chars)`);
    
    return response;
    
  } catch (error) {
    console.error('❌ Groq API error:', error.message);
    throw error;
  }
}

/**
 * Generate chat completion with conversation history
 * @param {Array} messages - Array of {role, content} messages
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Generated response
 */
async function generateWithHistory(messages, options = {}) {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 4000
  } = options;

  try {
    console.log(`🤖 Generating response with history (${messages.length} messages)...`);
    
    const groq = getGroqClient();
    
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: model,
      temperature: temperature,
      max_tokens: maxTokens,
      top_p: 1,
      stream: false
    });

    const response = completion.choices[0]?.message?.content || '';
    
    console.log(`✅ Groq response generated`);
    
    return response;
    
  } catch (error) {
    console.error('❌ Groq API error:', error.message);
    throw error;
  }
}

/**
 * Generate response with RAG context
 * @param {string} query - User query
 * @param {string} context - Retrieved context from RAG
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Generated response
 */
async function generateWithContext(query, context, options = {}) {
  const prompt = `Context from study notes:
${context}

Student's question: ${query}

Instructions:
- Answer based on the context provided above
- Be clear, concise, and educational
- If the context doesn't contain the answer, say so
- Use examples when helpful

Answer:`;

  return generateResponse(prompt, {
    ...options,
    systemPrompt: 'You are a helpful AI study assistant. Answer questions based on the provided context from the student\'s notes.'
  });
}

module.exports = {
  getGroqClient,
  generateResponse,
  generateWithHistory,
  generateWithContext,
  MODELS,
  DEFAULT_MODEL
};
