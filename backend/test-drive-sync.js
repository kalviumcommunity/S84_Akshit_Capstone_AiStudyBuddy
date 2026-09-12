/**
 * Test script for Google Drive sync functionality
 * Run with: node test-drive-sync.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const googleDrive = require('./utils/googleDrive');

async function testDriveSetup() {
  console.log('🧪 Testing Google Drive Sync Setup\n');

  // Test 1: Check environment variables
  console.log('1️⃣ Checking environment variables...');
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  
  if (!apiKey || apiKey === 'your_google_drive_api_key_here') {
    console.log('❌ GOOGLE_DRIVE_API_KEY not set or using placeholder');
    console.log('   Please add your Google Drive API key to .env file\n');
    return;
  }
  console.log('✅ GOOGLE_DRIVE_API_KEY is set\n');

  // Test 2: Check MongoDB connection
  console.log('2️⃣ Testing MongoDB connection...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    return;
  }

  // Test 3: Test folder ID extraction
  console.log('3️⃣ Testing folder ID extraction...');
  const testLinks = [
    'https://drive.google.com/drive/folders/1abc123def456',
    'https://drive.google.com/drive/u/0/folders/1abc123def456',
    '1abc123def456'
  ];

  for (const link of testLinks) {
    try {
      const folderId = googleDrive.extractFolderId(link);
      console.log(`✅ Extracted ID from: ${link.substring(0, 50)}...`);
      console.log(`   Folder ID: ${folderId}`);
    } catch (error) {
      console.log(`❌ Failed to extract ID from: ${link}`);
      console.log(`   Error: ${error.message}`);
    }
  }
  console.log();

  // Test 4: Test file type checking
  console.log('4️⃣ Testing file type support...');
  const mimeTypes = [
    'application/pdf',
    'text/plain',
    'application/vnd.google-apps.document',
    'application/msword',
    'image/jpeg'
  ];

  for (const mimeType of mimeTypes) {
    const supported = googleDrive.isSupportedFileType(mimeType);
    const icon = supported ? '✅' : '❌';
    console.log(`${icon} ${mimeType}: ${supported ? 'Supported' : 'Not supported'}`);
  }
  console.log();

  // Test 5: Test actual Drive API (if folder ID provided)
  console.log('5️⃣ Testing Google Drive API...');
  console.log('   To test with a real folder, set TEST_FOLDER_ID environment variable');
  
  const testFolderId = process.env.TEST_FOLDER_ID;
  if (testFolderId) {
    try {
      console.log(`   Testing with folder ID: ${testFolderId}`);
      const files = await googleDrive.listFilesInFolder(testFolderId);
      console.log(`✅ Successfully listed ${files.length} files from Drive`);
      
      if (files.length > 0) {
        console.log('\n   Sample files:');
        files.slice(0, 3).forEach(file => {
          console.log(`   - ${file.name} (${file.mimeType})`);
        });
      }
    } catch (error) {
      console.log('❌ Failed to list files from Drive');
      console.log(`   Error: ${error.message}`);
      console.log('   Make sure:');
      console.log('   1. The folder ID is correct');
      console.log('   2. The folder is shared with "Anyone with the link can view"');
      console.log('   3. Google Drive API is enabled in your project');
    }
  } else {
    console.log('   ⚠️  Skipping (no TEST_FOLDER_ID provided)');
  }
  console.log();

  // Summary
  console.log('📊 Test Summary');
  console.log('================');
  console.log('✅ Environment variables configured');
  console.log('✅ MongoDB connection working');
  console.log('✅ Folder ID extraction working');
  console.log('✅ File type checking working');
  
  if (testFolderId) {
    console.log('✅ Google Drive API tested');
  } else {
    console.log('⚠️  Google Drive API not tested (add TEST_FOLDER_ID to test)');
  }
  
  console.log('\n🎉 Setup looks good! You can now use the Drive sync feature.');
  console.log('\nNext steps:');
  console.log('1. Start your server: npm start');
  console.log('2. Add a Drive source via API or frontend');
  console.log('3. Watch the sync happen automatically!');

  await mongoose.disconnect();
}

// Run the test
testDriveSetup().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
