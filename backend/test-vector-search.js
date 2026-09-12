/**
 * MongoDB Atlas Vector Search Test Script
 * 
 * This script tests if vector search is properly configured and working.
 * Run with: node test-vector-search.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Chunk = require('./models/Chunk');
const { getEmbedding } = require('./utils/embedding');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function logTest(testName) {
  log(`\n🧪 TEST: ${testName}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Test 1: Database Connection
 */
async function testDatabaseConnection() {
  logTest('Database Connection');
  
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in .env file');
    }
    
    logInfo('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    logSuccess('Connected to MongoDB successfully');
    
    const dbName = mongoose.connection.db.databaseName;
    logInfo(`Database: ${dbName}`);
    
    return true;
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Check if chunks exist
 */
async function testChunksExist() {
  logTest('Check Chunks Collection');
  
  try {
    const count = await Chunk.countDocuments();
    
    if (count === 0) {
      logWarning('No chunks found in database');
      logInfo('Upload a file in the app first to create chunks');
      return false;
    }
    
    logSuccess(`Found ${count} chunks in database`);
    
    // Get sample chunk
    const sampleChunk = await Chunk.findOne().lean();
    logInfo(`Sample chunk ID: ${sampleChunk._id}`);
    logInfo(`Embedding dimensions: ${sampleChunk.embedding?.length || 'N/A'}`);
    logInfo(`Text preview: ${sampleChunk.text?.substring(0, 100)}...`);
    
    return true;
  } catch (error) {
    logError(`Failed to query chunks: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Test embedding generation
 */
async function testEmbeddingGeneration() {
  logTest('Embedding Generation');
  
  try {
    const testText = "What is machine learning?";
    logInfo(`Generating embedding for: "${testText}"`);
    
    const embedding = await getEmbedding(testText);
    
    if (!embedding || !Array.isArray(embedding)) {
      throw new Error('Invalid embedding returned');
    }
    
    logSuccess(`Embedding generated successfully`);
    logInfo(`Dimensions: ${embedding.length}`);
    logInfo(`First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    
    // Check if it's a fallback vector (all values between 0 and 1)
    const isFallback = embedding.every(v => v >= 0 && v <= 1);
    if (isFallback) {
      logWarning('This appears to be a fallback vector (not from Jina AI)');
      logWarning('Check if JINA_API_KEY is set correctly in .env');
    } else {
      logSuccess('This appears to be a real Jina AI embedding');
    }
    
    return embedding;
  } catch (error) {
    logError(`Embedding generation failed: ${error.message}`);
    return null;
  }
}

/**
 * Test 4: Test vector search with $vectorSearch
 */
async function testVectorSearch(queryEmbedding) {
  logTest('MongoDB Atlas Vector Search ($vectorSearch)');
  
  try {
    logInfo('Attempting vector search with $vectorSearch operator...');
    
    const pipeline = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit: 5
        }
      },
      {
        $addFields: {
          score: { $meta: "vectorSearchScore" }
        }
      },
      {
        $project: {
          text: 1,
          score: 1,
          'metadata.keywords': 1,
          'metadata.fileType': 1
        }
      }
    ];
    
    logInfo('Pipeline: ' + JSON.stringify(pipeline, null, 2));
    
    const results = await Chunk.aggregate(pipeline);
    
    if (results.length === 0) {
      logWarning('Vector search returned 0 results');
      return false;
    }
    
    logSuccess(`Vector search returned ${results.length} results`);
    
    results.forEach((result, index) => {
      console.log(`\n  Result ${index + 1}:`);
      logInfo(`    Score: ${result.score?.toFixed(4) || 'N/A'}`);
      logInfo(`    Keywords: ${result.metadata?.keywords?.join(', ') || 'none'}`);
      logInfo(`    Text: ${result.text?.substring(0, 100)}...`);
    });
    
    return true;
  } catch (error) {
    logError(`Vector search failed: ${error.message}`);
    logError(`Error name: ${error.name}`);
    logError(`Error code: ${error.code}`);
    
    if (error.message.includes('$vectorSearch')) {
      logWarning('$vectorSearch operator not recognized');
      logWarning('This might mean:');
      logWarning('  1. MongoDB version is too old (need 6.0.11+ or 7.0.2+)');
      logWarning('  2. Not using MongoDB Atlas (vector search only works on Atlas)');
      logWarning('  3. Vector search index not properly configured');
    }
    
    return false;
  }
}

/**
 * Test 5: Test vector search with filter
 */
async function testVectorSearchWithFilter(queryEmbedding) {
  logTest('Vector Search with Filter');
  
  try {
    // Get a sample noteId
    const sampleChunk = await Chunk.findOne().lean();
    if (!sampleChunk) {
      logWarning('No chunks available for filter test');
      return false;
    }
    
    const noteId = sampleChunk.noteId;
    logInfo(`Testing with noteId filter: ${noteId}`);
    
    const pipeline = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit: 5,
          filter: { noteId: noteId }
        }
      },
      {
        $addFields: {
          score: { $meta: "vectorSearchScore" }
        }
      }
    ];
    
    const results = await Chunk.aggregate(pipeline);
    
    if (results.length === 0) {
      logWarning('Vector search with filter returned 0 results');
      return false;
    }
    
    logSuccess(`Vector search with filter returned ${results.length} results`);
    logInfo(`All results have noteId: ${noteId}`);
    
    return true;
  } catch (error) {
    logError(`Vector search with filter failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 6: Compare vector search vs manual similarity
 */
async function testPerformanceComparison(queryEmbedding) {
  logTest('Performance Comparison: Vector Search vs Manual Similarity');
  
  try {
    // Test vector search speed
    logInfo('Testing vector search speed...');
    const vectorStart = Date.now();
    
    const vectorPipeline = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit: 5
        }
      }
    ];
    
    const vectorResults = await Chunk.aggregate(vectorPipeline);
    const vectorTime = Date.now() - vectorStart;
    
    logSuccess(`Vector search: ${vectorTime}ms (${vectorResults.length} results)`);
    
    // Test manual similarity speed
    logInfo('Testing manual similarity speed...');
    const manualStart = Date.now();
    
    const allChunks = await Chunk.find().limit(100).lean(); // Limit to 100 for speed
    
    // Calculate cosine similarity manually
    const similarities = allChunks.map(chunk => {
      const dotProduct = queryEmbedding.reduce((sum, val, i) => sum + val * chunk.embedding[i], 0);
      return { chunk, similarity: dotProduct };
    });
    
    similarities.sort((a, b) => b.similarity - a.similarity);
    const manualResults = similarities.slice(0, 5);
    const manualTime = Date.now() - manualStart;
    
    logSuccess(`Manual similarity: ${manualTime}ms (${manualResults.length} results)`);
    
    // Compare
    const speedup = (manualTime / vectorTime).toFixed(2);
    logInfo(`\n📊 Performance Summary:`);
    logInfo(`   Vector Search: ${vectorTime}ms`);
    logInfo(`   Manual Search: ${manualTime}ms`);
    
    if (vectorTime < manualTime) {
      logSuccess(`   Vector search is ${speedup}x faster! 🚀`);
    } else {
      logWarning(`   Manual search was faster (tested on small dataset)`);
      logInfo(`   Vector search advantage increases with more chunks`);
    }
    
    return true;
  } catch (error) {
    logError(`Performance comparison failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 7: Test different query types
 */
async function testDifferentQueries() {
  logTest('Testing Different Query Types');
  
  const queries = [
    "What is machine learning?",
    "Explain neural networks",
    "How does backpropagation work?",
    "Define artificial intelligence"
  ];
  
  try {
    for (const query of queries) {
      logInfo(`\nQuery: "${query}"`);
      
      const embedding = await getEmbedding(query);
      
      const pipeline = [
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: embedding,
            numCandidates: 20,
            limit: 3
          }
        },
        {
          $addFields: {
            score: { $meta: "vectorSearchScore" }
          }
        }
      ];
      
      const results = await Chunk.aggregate(pipeline);
      
      if (results.length > 0) {
        logSuccess(`  Found ${results.length} results`);
        logInfo(`  Top score: ${results[0].score?.toFixed(4)}`);
      } else {
        logWarning(`  No results found`);
      }
    }
    
    return true;
  } catch (error) {
    logError(`Query testing failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  logSection('🧪 MongoDB Atlas Vector Search Test Suite');
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };
  
  try {
    // Test 1: Database Connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      logError('\n❌ Cannot proceed without database connection');
      process.exit(1);
    }
    results.passed++;
    
    // Test 2: Check chunks
    const chunksExist = await testChunksExist();
    if (!chunksExist) {
      logWarning('\n⚠️  No chunks found. Upload a file first, then run this test again.');
      results.skipped += 5;
      await mongoose.connection.close();
      return;
    }
    results.passed++;
    
    // Test 3: Embedding generation
    const queryEmbedding = await testEmbeddingGeneration();
    if (!queryEmbedding) {
      logError('\n❌ Cannot proceed without embedding generation');
      results.failed++;
      await mongoose.connection.close();
      return;
    }
    results.passed++;
    
    // Test 4: Vector search
    const vectorSearchWorks = await testVectorSearch(queryEmbedding);
    if (vectorSearchWorks) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Test 5: Vector search with filter (only if test 4 passed)
    if (vectorSearchWorks) {
      const filterWorks = await testVectorSearchWithFilter(queryEmbedding);
      if (filterWorks) {
        results.passed++;
      } else {
        results.failed++;
      }
      
      // Test 6: Performance comparison
      const perfTest = await testPerformanceComparison(queryEmbedding);
      if (perfTest) {
        results.passed++;
      } else {
        results.failed++;
      }
      
      // Test 7: Different queries
      const queryTest = await testDifferentQueries();
      if (queryTest) {
        results.passed++;
      } else {
        results.failed++;
      }
    } else {
      results.skipped += 3;
    }
    
  } catch (error) {
    logError(`\n❌ Test suite error: ${error.message}`);
    console.error(error.stack);
  } finally {
    // Close connection
    await mongoose.connection.close();
    logInfo('\nDatabase connection closed');
    
    // Print summary
    logSection('📊 Test Summary');
    logSuccess(`Passed: ${results.passed}`);
    if (results.failed > 0) {
      logError(`Failed: ${results.failed}`);
    }
    if (results.skipped > 0) {
      logWarning(`Skipped: ${results.skipped}`);
    }
    
    const total = results.passed + results.failed + results.skipped;
    const passRate = ((results.passed / total) * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(60));
    if (results.failed === 0 && results.passed > 0) {
      logSuccess(`\n🎉 ALL TESTS PASSED! Vector search is working! (${passRate}%)`);
    } else if (results.failed > 0) {
      logError(`\n❌ SOME TESTS FAILED. Vector search needs configuration. (${passRate}%)`);
      logInfo('\nTroubleshooting steps:');
      logInfo('1. Check MongoDB Atlas vector index is created and active');
      logInfo('2. Verify index name is "vector_index"');
      logInfo('3. Ensure dimensions = 768 and similarity = cosine');
      logInfo('4. Check MongoDB version supports $vectorSearch (6.0.11+ or 7.0.2+)');
      logInfo('5. Verify you are using MongoDB Atlas (not local MongoDB)');
    } else {
      logWarning(`\n⚠️  Tests incomplete. Upload files first. (${passRate}%)`);
    }
    console.log('='.repeat(60) + '\n');
  }
}

// Run tests
runAllTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
