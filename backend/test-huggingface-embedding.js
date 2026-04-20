require('dotenv').config();
const { getEmbedding, getEmbeddings } = require('./utils/embedding');

async function testEmbeddings() {
  console.log('🧪 Testing Hugging Face Embedding API\n');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Single embedding
    console.log('\n📝 Test 1: Single text embedding');
    console.log('-'.repeat(50));
    const text1 = "What is artificial intelligence?";
    console.log(`Input: "${text1}"`);
    
    const embedding1 = await getEmbedding(text1);
    console.log(`✓ Embedding generated: ${embedding1.length} dimensions`);
    console.log(`  First 5 values: [${embedding1.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    
    // Test 2: Another single embedding
    console.log('\n📝 Test 2: Different text embedding');
    console.log('-'.repeat(50));
    const text2 = "Machine learning is a subset of AI";
    console.log(`Input: "${text2}"`);
    
    const embedding2 = await getEmbedding(text2);
    console.log(`✓ Embedding generated: ${embedding2.length} dimensions`);
    console.log(`  First 5 values: [${embedding2.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    
    // Test 3: Similarity check
    console.log('\n📊 Test 3: Similarity comparison');
    console.log('-'.repeat(50));
    const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));
    const similarity = dotProduct / (magnitude1 * magnitude2);
    console.log(`Cosine similarity: ${similarity.toFixed(4)}`);
    console.log(`(Higher values = more similar, range: -1 to 1)`);
    
    // Test 4: Batch embeddings
    console.log('\n📝 Test 4: Batch embeddings');
    console.log('-'.repeat(50));
    const texts = [
      "Python programming",
      "JavaScript development",
      "Data science"
    ];
    console.log(`Processing ${texts.length} texts...`);
    
    const embeddings = await getEmbeddings(texts);
    console.log(`✓ Generated ${embeddings.length} embeddings`);
    embeddings.forEach((emb, i) => {
      console.log(`  ${i + 1}. "${texts[i]}" → ${emb.length} dimensions`);
    });
    
    // Test 5: Cache test
    console.log('\n💾 Test 5: Cache verification');
    console.log('-'.repeat(50));
    console.log('Requesting same text again (should use cache)...');
    const cachedEmbedding = await getEmbedding(text1);
    console.log(`✓ Retrieved: ${cachedEmbedding.length} dimensions`);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testEmbeddings().then(() => {
  console.log('\n✨ Test suite finished\n');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
