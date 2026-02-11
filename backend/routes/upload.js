// routes/upload.js - Updated to use Cloudinary with AI analysis

const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure multer for memory storage (files will be stored in memory temporarily)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images and PDFs
  if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
  }
};

// Init upload middleware
const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit (Cloudinary can handle larger files)
  }
});

// Helper function to analyze image with AI
const analyzeImageWithAI = async (imageUrl) => {
  try {
    console.log('Starting AI analysis for image:', imageUrl);
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Fetch image and convert to base64
    console.log('Fetching image from URL...');
    const response = await fetch(imageUrl, {
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'AI-Study-Buddy/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    console.log('Image converted to base64, size:', base64.length);

    // Determine the actual mime type from the response
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const mimeType = contentType.startsWith('image/') ? contentType : 'image/jpeg';
    
    const prompt = `
    You are an AI study assistant analyzing this image for educational purposes. Please provide a comprehensive, conversational analysis that includes:
    
    1. A warm greeting and acknowledgment of the uploaded content
    2. Detailed description of what you see in the image
    3. Key educational concepts, formulas, or information present
    4. Study tips and explanations related to the content
    5. Suggestions for further learning or related topics
    6. A friendly conclusion encouraging questions
    
    Please write in a conversational, helpful tone as if you're a knowledgeable tutor. Avoid excessive use of ** markdown symbols and focus on clear, engaging explanations.
    
    Make your response detailed and educational, around 200-300 words.
    `;

    console.log('Sending request to Gemini AI...');
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64,
          mimeType: mimeType
        }
      }
    ]);

    const aiResponse = await result.response;
    const text = aiResponse.text();
    console.log('AI analysis completed successfully, response length:', text.length);
    return text;
  } catch (error) {
    console.error('AI analysis error details:', {
      message: error.message,
      stack: error.stack?.substring(0, 200),
      imageUrl: imageUrl
    });
    
    // Return a more helpful error message
    if (error.message.includes('fetch')) {
      return 'Unable to access the uploaded image for AI analysis. The image was uploaded successfully to Cloudinary, but AI analysis is temporarily unavailable due to network connectivity issues.';
    } else if (error.message.includes('GEMINI_API_KEY')) {
      return 'AI analysis is not configured. Please contact the administrator.';
    } else {
      return 'AI analysis encountered an error. The image was uploaded successfully, but automatic analysis failed. You can try uploading again or analyze the content manually.';
    }
  }
};
const uploadToCloudinary = (buffer, originalname, mimetype) => {
  return new Promise((resolve, reject) => {
    const resourceType = mimetype.startsWith('image/') ? 'image' : 'raw';
    
    cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: 'aistudybuddy', // Organize files in a folder
        public_id: `${Date.now()}-${originalname.split('.')[0]}`, // Unique filename
        use_filename: true,
        unique_filename: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

// Upload endpoint - protected by authentication
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('User:', req.user ? req.user._id : 'No user');
    console.log('File:', req.file ? req.file.originalname : 'No file');
    
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please select a file to upload'
      });
    }

    console.log('Cloudinary config check:');
    console.log('Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('API key:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set');
    console.log('API secret:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set');

    // Upload to Cloudinary
    console.log('Starting Cloudinary upload...');
    const result = await uploadToCloudinary(
      req.file.buffer, 
      req.file.originalname, 
      req.file.mimetype
    );
    console.log('Cloudinary upload successful:', result.public_id);

    let aiSummary = 'File uploaded successfully';
    
    // If it's an image, analyze it with AI
    if (req.file.mimetype.startsWith('image/')) {
      console.log('Image detected, starting AI analysis...');
      console.log('Gemini API Key configured:', process.env.GEMINI_API_KEY ? 'Yes' : 'No');
      console.log('Image URL for analysis:', result.secure_url);
      
      try {
        // Set a timeout for AI analysis
        const analysisPromise = analyzeImageWithAI(result.secure_url);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI analysis timeout')), 45000) // 45 second timeout
        );
        
        aiSummary = await Promise.race([analysisPromise, timeoutPromise]);
        console.log('AI analysis completed successfully');
      } catch (error) {
        console.error('AI analysis failed with error:', error.message);
        aiSummary = `Image uploaded successfully to Cloudinary. AI analysis failed: ${error.message}. You can try re-uploading or analyze the content manually.`;
      }
    }

    // Return the file information
    res.json({
      message: 'File uploaded successfully',
      file: {
        _id: result.public_id, // Use Cloudinary public_id as the file ID
        filename: result.public_id,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: result.secure_url, // Cloudinary URL
        cloudinary_id: result.public_id,
        resource_type: result.resource_type,
        created_at: result.created_at,
        summary: aiSummary, // AI-generated summary for images
        isImage: req.file.mimetype.startsWith('image/'),
        aiAnalyzed: req.file.mimetype.startsWith('image/')
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

// Get all uploaded files from Cloudinary - protected by authentication
router.get('/files', auth, async (req, res) => {
  try {
    // Get files from Cloudinary folder
    const result = await cloudinary.search
      .expression('folder:aistudybuddy')
      .sort_by([['created_at', 'desc']])
      .max_results(100)
      .execute();

    const files = result.resources.map(file => ({
      filename: file.public_id,
      url: file.secure_url,
      size: file.bytes,
      created: file.created_at,
      resource_type: file.resource_type,
      format: file.format
    }));

    res.json({ files });
  } catch (error) {
    console.error('Error fetching files from Cloudinary:', error);
    res.status(500).json({
      error: 'Failed to fetch files',
      message: error.message
    });
  }
});

// Delete file from Cloudinary - protected by authentication
router.delete('/:publicId', auth, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      res.json({
        message: 'File deleted successfully',
        public_id: publicId
      });
    } else {
      res.status(404).json({
        error: 'File not found',
        message: 'The file could not be found or has already been deleted'
      });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      error: 'Delete failed',
      message: error.message
    });
  }
});

module.exports = router;
