const {
  Document,
  VectorStoreIndex,
  SimpleDirectoryReader,
  Settings,
  storageContextFromDefaults,
  MongoDBAtlasVectorSearch
} = require('llamaindex');
const { embedText, embedBatch } = require('./jinaEmbedding');
const { generateWithContext } = require('./groqClient');
const mongoose = require('mongoose');

/**
 * LlamaIndex Configuration with Jina Embeddings + Groq LLM + MongoDB
 */

// Custom Jina Embedding class for LlamaIndex
class JinaEmbedding {
  async getTextEmbedding(text) {
    return await embedText(text);
  }

  async getQueryEmbedding(query) {
    return await embedText(query);
  }

  async getTextEmbeddings(texts) {
    return await embedBatch(texts);
  }
}

// Custom Groq LLM class for LlamaIndex
class GroqLLM {
  async chat(messages) {
    // Convert LlamaIndex message format to Groq format
    const lastMessage = messages[messages.length - 1];
    const context = messages.slice(0, -1).map(m => m.content).join('\n\n');
    
    const response = await generateWithContext(
      lastMessage.content,
      context
    );
    
    return { message: { content: response } };
  }

  async complete(prompt) {
    const { generateResponse } = require('./groqClient');
    return { text: await generateResponse(prompt) };
  }
}

/**
 * Initialize LlamaIndex with custom settings
 */
function initializeLlamaIndex() {
  console.log('🔧 Initializing LlamaIndex with Jina + Groq...');
  
  // Set custom embedding model
  Settings.embedModel = new JinaEmbedding();
  
  // Set custom LLM
  Settings.llm = new GroqLLM();
  
  // Set chunk size and overlap
  Settings.chunkSize = 512;
  Settings.chunkOverlap = 50;
  
  console.log('✅ LlamaIndex initialized');
  console.log('   Embeddings: Jina AI (1024 dimensions)');
  console.log('   LLM: Groq + Llama 3.1 70B');
  console.log('   Chunk size: 512 tokens');
  console.log('   Chunk overlap: 50 tokens');
}

/**
 * Create MongoDB vector store for LlamaIndex
 * @param {string} collectionName - MongoDB collection name
 * @returns {Promise<MongoDBAtlasVectorSearch>} Vector store instance
 */
async function createMongoVectorStore(collectionName = 'llamaindex_vectors') {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI not configured');
    }

    console.log(`📦 Creating MongoDB vector store: ${collectionName}`);
    
    // Extract database name from URI
    const dbName = mongoUri.split('/').pop().split('?')[0] || 'aistudybuddy';
    
    const vectorStore = new MongoDBAtlasVectorSearch({
      mongoUri: mongoUri,
      dbName: dbName,
      collectionName: collectionName,
      indexName: 'vector_index',
      embeddingKey: 'embedding',
      textKey: 'text',
      metadataKey: 'metadata'
    });
    
    console.log('✅ MongoDB vector store created');
    
    return vectorStore;
    
  } catch (error) {
    console.error('❌ Error creating MongoDB vector store:', error.message);
    throw error;
  }
}

/**
 * Create index from documents
 * @param {Array<Document>} documents - Array of LlamaIndex documents
 * @param {string} userId - User ID for filtering
 * @param {string} noteId - Note ID for filtering
 * @returns {Promise<VectorStoreIndex>} Created index
 */
async function createIndexFromDocuments(documents, userId, noteId) {
  try {
    console.log(`📚 Creating index from ${documents.length} documents...`);
    
    // Add metadata to documents
    documents.forEach(doc => {
      doc.metadata = {
        ...doc.metadata,
        userId: userId,
        noteId: noteId,
        createdAt: new Date().toISOString()
      };
    });
    
    // Create vector store
    const vectorStore = await createMongoVectorStore();
    
    // Create storage context
    const storageContext = await storageContextFromDefaults({ vectorStore });
    
    // Create index
    const index = await VectorStoreIndex.fromDocuments(documents, {
      storageContext
    });
    
    console.log('✅ Index created successfully');
    
    return index;
    
  } catch (error) {
    console.error('❌ Error creating index:', error.message);
    throw error;
  }
}

/**
 * Create index from text content
 * @param {string} text - Text content to index
 * @param {Object} metadata - Document metadata
 * @returns {Promise<VectorStoreIndex>} Created index
 */
async function createIndexFromText(text, metadata = {}) {
  const document = new Document({
    text: text,
    metadata: metadata
  });
  
  return createIndexFromDocuments([document], metadata.userId, metadata.noteId);
}

/**
 * Query existing index
 * @param {string} query - User query
 * @param {Object} filter - MongoDB filter (userId, noteId)
 * @param {number} topK - Number of results to return
 * @returns {Promise<Object>} Query results with context and response
 */
async function queryIndex(query, filter = {}, topK = 5) {
  try {
    console.log(`🔍 Querying index: "${query.substring(0, 50)}..."`);
    console.log(`   Filter:`, filter);
    console.log(`   Top K: ${topK}`);
    
    // Create vector store with filter
    const vectorStore = await createMongoVectorStore();
    
    // Create storage context
    const storageContext = await storageContextFromDefaults({ vectorStore });
    
    // Load index from storage
    const index = await VectorStoreIndex.fromVectorStore(vectorStore, storageContext);
    
    // Create query engine
    const queryEngine = index.asQueryEngine({
      similarityTopK: topK
    });
    
    // Execute query
    const response = await queryEngine.query(query);
    
    console.log('✅ Query completed');
    
    return {
      response: response.response,
      sourceNodes: response.sourceNodes,
      metadata: response.metadata
    };
    
  } catch (error) {
    console.error('❌ Error querying index:', error.message);
    throw error;
  }
}

module.exports = {
  initializeLlamaIndex,
  createMongoVectorStore,
  createIndexFromDocuments,
  createIndexFromText,
  queryIndex,
  JinaEmbedding,
  GroqLLM
};
