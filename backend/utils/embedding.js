const fetch = require('node-fetch');
const cache = require('./cache');

/**
 * Generate embedding vector for text using Jina AI or OpenAI
 * Jina AI: jina-embeddings-v2-base-en (768 dimensions, 1M tokens/month free)
 * OpenAI: text-embedding-3-small (1536 dimensions, paid)
 * 
 * @param {string} text - The text to embed
 * @returns {Promise<Array<number>>} Embedding vector
 */
async function getEmbedding(text) {
  try {
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new Error('Invalid text input for embedding');
    }

    // Check for API keys
    const jinaApiKey = process.env.JINA_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!jinaApiKey && !openaiApiKey) {
      console.log('   ⚠️  No embedding API key configured, using fallback');
      return createSimpleVector(text);
    }

    // Check cache first
    const cacheKey = cache.embeddingKey(text);
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log('   ✓ Embedding cache hit');
      return cached;
    }

    let embedding;

    // Try Jina AI first (preferred - free and designed for embeddings)
    if (jinaApiKey) {
      try {
        const url = "https://api.jina.ai/v1/embeddings";
        console.log('   🔍 Calling Jina AI embeddings API');
        
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${jinaApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: [text.substring(0, 8000)],
            model: "jina-embeddings-v2-base-en"
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data && result.data[0] && result.data[0].embedding) {
            embedding = result.data[0].embedding;
            console.log('   ✅ Generated Jina AI embedding:', embedding.length, 'dimensions');
          }
        } else {
          const errorText = await response.text();
          console.log(`   ⚠️  Jina AI error (${response.status}): ${errorText}`);
        }
      } catch (jinaError) {
        console.log('   ⚠️  Jina AI request failed:', jinaError.message);
      }
    }

    // Fallback to OpenAI if Jina failed
    if (!embedding && openaiApiKey) {
      try {
        const url = "https://api.openai.com/v1/embeddings";
        console.log('   🔍 Calling OpenAI embeddings API');
        
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: text.substring(0, 8000),
            model: "text-embedding-3-small"
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data && result.data[0] && result.data[0].embedding) {
            embedding = result.data[0].embedding;
            console.log('   ✅ Generated OpenAI embedding:', embedding.length, 'dimensions');
          }
        } else {
          const errorText = await response.text();
          console.log(`   ⚠️  OpenAI error (${response.status}): ${errorText}`);
        }
      } catch (openaiError) {
        console.log('   ⚠️  OpenAI request failed:', openaiError.message);
      }
    }

    // If both APIs failed, use fallback
    if (!embedding) {
      console.log('   ⚠️  All embedding APIs failed, using fallback');
      return createSimpleVector(text);
    }

    // Cache the embedding (24 hours TTL)
    await cache.set(cacheKey, embedding, 86400);
    
    return embedding;

  } catch (error) {
    console.error('   ❌ Error generating embedding:', error.message);
    return createSimpleVector(text);
  }
}

/**
 * Create a simple deterministic vector from text (fallback method)
 * @param {string} text - The text to vectorize
 * @returns {Array<number>} Simple vector representation (768 dimensions)
 */
function createSimpleVector(text) {
  const vector = [];
  const cleanText = text.toLowerCase().trim();
  
  // Create 768-dimensional vector
  const textLength = cleanText.length;
  const wordCount = cleanText.split(/\s+/).length;
  const uniqueChars = new Set(cleanText).size;
  
  for (let i = 0; i < 768; i++) {
    const charIndex = i % cleanText.length;
    const charCode = cleanText.charCodeAt(charIndex) || 0;
    
    const lengthFactor = (textLength * i) % 100 / 100;
    const wordFactor = (wordCount * i) % 100 / 100;
    const charFactor = (charCode + i * 0.1) % 1;
    const uniqueFactor = (uniqueChars * i) % 100 / 100;
    
    const value = (charFactor * 0.4 + lengthFactor * 0.2 + wordFactor * 0.2 + uniqueFactor * 0.2);
    vector.push(value);
  }
  
  // Normalize the vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / magnitude);
}

/**
 * Generate embeddings for multiple texts in batch
 * @param {Array<string>} texts - Array of texts to embed
 * @returns {Promise<Array<Array<number>>>} Array of embedding vectors
 */
async function getEmbeddings(texts) {
  try {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Invalid texts input for embeddings');
    }

    const embeddings = [];
    for (const text of texts) {
      const embedding = await getEmbedding(text);
      embeddings.push(embedding);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return embeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

module.exports = { getEmbedding, getEmbeddings };
