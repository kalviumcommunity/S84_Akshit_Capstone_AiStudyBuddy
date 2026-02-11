// Simple test script to verify AI functionality
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testAI() {
  try {
    console.log('Testing Gemini AI connection...');
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try the correct model names for the current API
    const modelNames = [
      'gemini-2.5-flash',
      'gemini-2.5-pro', 
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-3-flash-preview',
      'gemini-3-pro-preview'
    ];
    
    let workingModel = null;
    
    for (const modelName of modelNames) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = "Hello! Can you analyze images for study purposes?";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        workingModel = modelName;
        console.log(`✅ Model ${modelName} works!`);
        console.log('Response:', text.substring(0, 100) + '...');
        break;
      } catch (error) {
        console.log(`❌ Model ${modelName} failed:`, error.message.substring(0, 100) + '...');
      }
    }
    
    if (!workingModel) {
      throw new Error('No working model found. Please check your API key and try again.');
    }
    
    console.log('✅ AI Connection successful!');
    console.log(`Working model: ${workingModel}`);
    
  } catch (error) {
    console.error('❌ AI Connection failed:', error.message);
  }
}

async function testCloudinary() {
  try {
    console.log('\nTesting Cloudinary connection...');
    
    const cloudinary = require('./config/cloudinary');
    
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary credentials not found in environment variables');
    }
    
    // Test by getting account details
    const result = await cloudinary.api.ping();
    
    console.log('✅ Cloudinary Connection successful!');
    console.log('Status:', result.status);
    
  } catch (error) {
    console.error('❌ Cloudinary Connection failed:', error.message);
  }
}

// Run tests
console.log('🧪 Running AI Study Buddy Backend Tests...\n');
testAI();
testCloudinary();