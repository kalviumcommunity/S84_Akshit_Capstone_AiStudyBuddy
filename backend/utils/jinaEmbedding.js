const fetch = require('node-fetch');

/**
 * Jina AI Embedding Service
 * Free tier: 1M tokens/month
 * Model: jina-embeddings-v3
 * Dimensions: 1024
 */

const JINA_API_URL = 'https://api.jina.ai/v1/embeddings';
const JINA_MODEL = 'jina-embeddings-v3';

/**
 * Generate embeddings using Jina AI
 * @param {string|string[]} texts - Single text or array of texts
 * @returns {Promise<number[]|number[][]>} Embedding vector(s)
 */
async function getJinaEmbedding(texts) {
  const apiKey = process.env.JINA_API_KEY;
  
  if (!apiKey) {
    throw new Error('JINA_API_KEY not configured in environment variables');
  }

  const isArray = Array.isArray(texts);
  const input = isArray ? texts : [texts];

  try {
    console.log(`🔄 Generating Jina embeddings for ${input.length} text(s)...`);
    
    const response = await fetch(JINA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: JINA_MODEL,
        input: input,
        encoding_type: 'float'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jina API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    // Extract embeddings from response
    const embeddings = data.data.map(item => item.embedding);
    
    console.log(`✅ Generated ${embeddings.length} Jina embeddings (${embeddings[0].length} dimensions)`);
    
    // Return single embedding or array based on input
    return isArray ? embeddings : embeddings[0];
    
  } catch (error) {
    console.error('❌ Jina embedding error:', error.message);
    throw error;
  }
}

/**
 * Generate embedding for a single text
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} Embedding vector
 */
async function embedText(text) {
  return getJinaEmbedding(text);
}

/**
 * Generate embeddings for multiple texts (batch)
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} Array of embedding vectors
 */
async function embedBatch(texts) {
  return getJinaEmbedding(texts);
}

module.exports = {
  getJinaEmbedding,
  embedText,
  embedBatch,
  JINA_MODEL
};
