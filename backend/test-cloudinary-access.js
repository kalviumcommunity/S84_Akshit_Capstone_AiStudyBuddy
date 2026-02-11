// Test if we can access Cloudinary URLs
const fetch = require('node-fetch');
const cloudinary = require('./config/cloudinary');
require('dotenv').config();

async function testCloudinaryAccess() {
  try {
    console.log('🧪 Testing Cloudinary Access...\n');
    
    // Test 1: Check Cloudinary configuration
    console.log('1. Checking Cloudinary configuration...');
    console.log('Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('API key configured:', process.env.CLOUDINARY_API_KEY ? 'Yes' : 'No');
    console.log('API secret configured:', process.env.CLOUDINARY_API_SECRET ? 'Yes' : 'No');
    
    // Test 2: Try to ping Cloudinary
    console.log('\n2. Testing Cloudinary connection...');
    const pingResult = await cloudinary.api.ping();
    console.log('✅ Cloudinary ping successful:', pingResult.status);
    
    // Test 3: List some files to get a real URL
    console.log('\n3. Getting sample files from Cloudinary...');
    const searchResult = await cloudinary.search
      .expression('folder:aistudybuddy')
      .max_results(5)
      .execute();
    
    if (searchResult.resources.length > 0) {
      console.log(`Found ${searchResult.resources.length} files in Cloudinary`);
      
      // Test 4: Try to fetch one of the images
      const sampleImage = searchResult.resources[0];
      console.log('\n4. Testing fetch from Cloudinary URL...');
      console.log('Sample image URL:', sampleImage.secure_url);
      
      try {
        const fetchResponse = await fetch(sampleImage.secure_url);
        console.log('Fetch response status:', fetchResponse.status);
        console.log('Fetch response headers:', Object.fromEntries(fetchResponse.headers));
        
        if (fetchResponse.ok) {
          const buffer = await fetchResponse.buffer();
          console.log('✅ Successfully fetched image, size:', buffer.length, 'bytes');
        } else {
          console.log('❌ Failed to fetch image:', fetchResponse.statusText);
        }
      } catch (fetchError) {
        console.log('❌ Fetch error:', fetchError.message);
      }
    } else {
      console.log('No files found in Cloudinary folder "aistudybuddy"');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testCloudinaryAccess();