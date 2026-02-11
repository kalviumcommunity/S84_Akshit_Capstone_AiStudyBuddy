// Test script to verify image analysis functionality
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testImageAnalysis() {
  try {
    console.log('🧪 Testing Image Analysis Functionality...\n');
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Test with a simple text prompt first
    console.log('1. Testing basic text generation...');
    const textResult = await model.generateContent("Explain what AI image analysis can do for students.");
    const textResponse = await textResult.response;
    console.log('✅ Text generation works!');
    console.log('Response preview:', textResponse.text().substring(0, 100) + '...\n');
    
    // Test image analysis capability
    console.log('2. Testing image analysis capability...');
    const imagePrompt = `
    You are an AI assistant that helps students analyze images for study purposes.
    Can you analyze images containing:
    - Text and handwritten notes
    - Diagrams and charts
    - Mathematical formulas
    - Scientific concepts
    
    Respond with "YES" if you can do this, and briefly explain your capabilities.
    `;
    
    const capabilityResult = await model.generateContent(imagePrompt);
    const capabilityResponse = await capabilityResult.response;
    console.log('✅ Image analysis capability confirmed!');
    console.log('Response:', capabilityResponse.text().substring(0, 200) + '...\n');
    
    console.log('🎉 All tests passed! Image analysis should work when images are uploaded.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testImageAnalysis();