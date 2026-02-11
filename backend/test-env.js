// Test environment variables
require('dotenv').config();

console.log('🧪 Testing Environment Variables...\n');

console.log('Environment variables:');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Set (length: ' + process.env.CLOUDINARY_API_KEY.length + ')' : 'Not set');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Set (length: ' + process.env.CLOUDINARY_API_SECRET.length + ')' : 'Not set');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'Not set');

// Test Cloudinary configuration
const cloudinary = require('./config/cloudinary');

console.log('\nCloudinary config:');
console.log('Cloud name from config:', cloudinary.config().cloud_name);
console.log('API key from config:', cloudinary.config().api_key ? 'Set' : 'Not set');
console.log('API secret from config:', cloudinary.config().api_secret ? 'Set' : 'Not set');