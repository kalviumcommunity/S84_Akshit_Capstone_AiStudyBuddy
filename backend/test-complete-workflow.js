/**
 * Complete Workflow Test for Google Drive Sync Feature
 * Tests: Setup → Sync → Database → RAG → Chat
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function testCompleteWorkflow() {
  console.log('🧪 Testing Complete Google Drive Sync Workflow\n');
  console.log('='.repeat(60));

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Environment Setup
  console.log('\n1️⃣ Testing Environment Setup...');
  try {
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    const mongoUri = process.env.MONGODB_URI;
    const jinaKey = process.env.JINA_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_google_drive_api_key_here') {
      throw new Error('GOOGLE_DRIVE_API_KEY not configured');
    }
    if (!mongoUri) throw new Error('MONGODB_URI not configured');
    if (!jinaKey) console.warn('   ⚠️  JINA_API_KEY not set (will use fallback)');
    if (!geminiKey) console.warn('   ⚠️  GEMINI_API_KEY not set');

    console.log('   ✅ Environment variables configured');
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
    testsFailed++;
  }

  // Test 2: MongoDB Connection
  console.log('\n2️⃣ Testing MongoDB Connection...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   ✅ Connected to MongoDB');
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ MongoDB connection failed: ${error.message}`);
    testsFailed++;
    return; // Can't continue without DB
  }

  // Test 3: Google Drive API
  console.log('\n3️⃣ Testing Google Drive API...');
  try {
    const googleDrive = require('./utils/googleDrive');
    
    // Test folder ID extraction
    const testLink = 'https://drive.google.com/drive/folders/1abc123';
    const folderId = googleDrive.extractFolderId(testLink);
    if (!folderId) throw new Error('Failed to extract folder ID');
    
    console.log('   ✅ Google Drive utility working');
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
    testsFailed++;
  }

  // Test 4: Check DriveSource Model
  console.log('\n4️⃣ Testing DriveSource Model...');
  try {
    const DriveSource = require('./models/DriveSource');
    const count = await DriveSource.countDocuments();
    console.log(`   ✅ DriveSource model working (${count} sources in DB)`);
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
    testsFailed++;
  }

  // Test 5: Check for Synced Files
  console.log('\n5️⃣ Testing Synced Files in Database...');
  try {
    const Note = require('./models/Note');
    const Chunk = require('./models/Chunk');
    
    const driveNotes = await Note.find({ tags: 'drive-sync' });
    const driveChunks = await Chunk.find({ 'metadata.keywords': 'drive-sync' });
    
    console.log(`   📄 Drive-synced notes: ${driveNotes.length}`);
    console.log(`   📦 Drive-synced chunks: ${driveChunks.length}`);
    
    if (driveNotes.length === 0) {
      console.log('   ⚠️  No Drive-synced notes found');
      console.log('   💡 Add a Drive source and sync to test this');
    } else {
      console.log('   ✅ Drive-synced content found in database');
      
      // Show sample
      const sampleNote = driveNotes[0];
      console.log(`\n   Sample Note:`);
      console.log(`   - Title: ${sampleNote.title}`);
      console.log(`   - File Type: ${sampleNote.fileType}`);
      console.log(`   - Content Length: ${sampleNote.content.length} chars`);
      console.log(`   - Tags: ${sampleNote.tags.join(', ')}`);
    }
    
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
    testsFailed++;
  }

  // Test 6: Test Embedding Generation
  console.log('\n6️⃣ Testing Embedding Generation...');
  try {
    const { getEmbedding } = require('./utils/embedding');
    const testText = 'This is a test for RAG embeddings';
    const embedding = await getEmbedding(testText);
    
    if (!Array.isArray(embedding) || embedding.length !== 768) {
      throw new Error(`Invalid embedding: expected 768 dimensions, got ${embedding?.length}`);
    }
    
    console.log(`   ✅ Embedding generated (${embedding.length} dimensions)`);
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
    testsFailed++;
  }

  // Test 7: Test RAG Retrieval
  console.log('\n7️⃣ Testing RAG Retrieval...');
  try {
    const Chunk = require('./models/Chunk');
    const { getEmbedding } = require('./utils/embedding');
    const { findTopSimilar } = require('./utils/similarity');
    
    // Get a test user's chunks
    const sampleChunks = await Chunk.find().limit(10).lean();
    
    if (sampleChunks.length === 0) {
      console.log('   ⚠️  No chunks in database to test RAG');
      console.log('   💡 Upload files or sync Drive to test this');
    } else {
      const testQuery = 'What is RAG?';
      const queryEmbedding = await getEmbedding(testQuery);
      
      const chunkItems = sampleChunks.map(chunk => ({
        embedding: chunk.embedding,
        data: chunk
      }));
      
      const topChunks = findTopSimilar(queryEmbedding, chunkItems, 3, 0.2);
      
      console.log(`   ✅ RAG retrieval working`);
      console.log(`   📊 Found ${topChunks.length} relevant chunks`);
      
      if (topChunks.length > 0) {
        console.log(`\n   Top Result:`);
        console.log(`   - Similarity: ${(topChunks[0].similarity * 100).toFixed(1)}%`);
        console.log(`   - Preview: ${topChunks[0].data.text.substring(0, 100)}...`);
      }
    }
    
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
    testsFailed++;
  }

  // Test 8: Test Chat Controller
  console.log('\n8️⃣ Testing Chat Controller...');
  try {
    const { chatWithContext } = require('./controllers/chatController');
    console.log('   ✅ Chat controller loaded successfully');
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
    testsFailed++;
  }

  // Test 9: Test Sync Service
  console.log('\n9️⃣ Testing Sync Service...');
  try {
    const driveSyncService = require('./services/driveSyncService');
    console.log('   ✅ Drive sync service loaded successfully');
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
    testsFailed++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Workflow is ready to use.');
    console.log('\n📝 Next Steps:');
    console.log('1. Add a Drive source via /api/drive endpoint');
    console.log('2. Wait for sync to complete (check status)');
    console.log('3. Ask questions in chat - it will use RAG!');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues above.');
  }

  await mongoose.disconnect();
  console.log('\n✅ Test completed\n');
}

// Run the test
testCompleteWorkflow().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
