/**
 * Complete RAG Pipeline Test
 * Tests: Chunking → Embeddings → Storage → Retrieval → Similarity
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { chunkText } = require('./utils/chunkText');
const { getEmbedding } = require('./utils/embedding');
const { findTopSimilar } = require('./utils/similarity');
const Chunk = require('./models/Chunk');

// Test document
const testDocument = `
Artificial Intelligence (AI) is the simulation of human intelligence by machines.
Machine learning is a subset of AI that enables systems to learn from data.
Deep learning uses neural networks with multiple layers to process information.
Natural Language Processing (NLP) helps computers understand human language.
Computer vision allows machines to interpret and understand visual information.
Reinforcement learning trains agents through rewards and penalties.
`;

async function testRAGPipeline() {
  console.log('🧪 Testing Complete RAG Pipeline\n');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Connect to MongoDB
    console.log('\n📊 Step 1: Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Step 2: Chunk the text
    console.log('\n📄 Step 2: Chunking text...');
    const chunks = chunkText(testDocument, 50, 10); // Small chunks for testing
    console.log(`✅ Generated ${chunks.length} chunks`);
    chunks.forEach((chunk, i) => {
      console.log(`   Chunk ${i + 1}: "${chunk.substring(0, 60)}..."`);
    });
    
    // Step 3: Generate embeddings
    console.log('\n🔢 Step 3: Generating embeddings...');
    const embeddings = [];
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await getEmbedding(chunks[i]);
      embeddings.push(embedding);
      console.log(`   ✅ Embedding ${i + 1}/${chunks.length} (${embedding.length} dimensions)`);
    }
    
    // Step 4: Store in MongoDB
    console.log('\n💾 Step 4: Storing chunks in MongoDB...');
    const testNoteId = new mongoose.Types.ObjectId();
    const testUserId = new mongoose.Types.ObjectId();
    
    // Clear any existing test data
    await Chunk.deleteMany({ noteId: testNoteId });
    
    const chunkDocs = chunks.map((text, index) => ({
      text,
      embedding: embeddings[index],
      noteId: testNoteId,
      userId: testUserId,
      metadata: {
        chunkIndex: index,
        totalChunks: chunks.length,
        wordCount: text.split(/\s+/).length
      }
    }));
    
    await Chunk.insertMany(chunkDocs);
    console.log(`✅ Stored ${chunkDocs.length} chunks in MongoDB`);
    
    // Step 5: Test retrieval with different queries
    console.log('\n🔍 Step 5: Testing retrieval with queries...');
    
    const testQueries = [
      'What is machine learning?',
      'How does deep learning work?',
      'Tell me about NLP',
      'What is computer vision?'
    ];
    
    for (const query of testQueries) {
      console.log(`\n   Query: "${query}"`);
      
      // Generate query embedding
      const queryEmbedding = await getEmbedding(query);
      
      // Retrieve chunks from database
      const storedChunks = await Chunk.find({ noteId: testNoteId }).lean();
      
      // Calculate similarity
      const chunkItems = storedChunks.map(chunk => ({
        embedding: chunk.embedding,
        data: chunk
      }));
      
      const topChunks = findTopSimilar(queryEmbedding, chunkItems, 2, 0.0);
      
      console.log(`   Found ${topChunks.length} relevant chunks:`);
      topChunks.forEach((item, i) => {
        console.log(`   ${i + 1}. Similarity: ${item.similarity.toFixed(4)}`);
        console.log(`      Text: "${item.data.text.substring(0, 80)}..."`);
      });
    }
    
    // Step 6: Cleanup
    console.log('\n🧹 Step 6: Cleaning up test data...');
    await Chunk.deleteMany({ noteId: testNoteId });
    console.log('✅ Test data cleaned up');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ RAG Pipeline Test Complete!');
    console.log('\nSummary:');
    console.log(`  - Chunking: ✅ Working`);
    console.log(`  - Embeddings: ✅ Working (${embeddings[0].length} dimensions)`);
    console.log(`  - MongoDB Storage: ✅ Working`);
    console.log(`  - Similarity Search: ✅ Working`);
    console.log(`  - Retrieval: ✅ Working`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n📊 Disconnected from MongoDB');
  }
}

testRAGPipeline();
