// routes/upload.js - Updated to use Cloudinary with AI analysis

const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');
const pdf = require('pdf-parse');
const Note = require('../models/Note');
const { extractTextWithOCR } = require('../utils/ocr');
const { processNoteChunks } = require('../controllers/noteController');
const apiKeyManager = require('../utils/apiKeyManager');

const router = express.Router();

// Initialize Gemini AI with key rotation
function getGenAI() {
  const apiKey = apiKeyManager.getNextKey();
  return new GoogleGenerativeAI(apiKey);
}

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
    
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
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
    console.log('========================================');
    console.log('📥 UPLOAD REQUEST RECEIVED');
    console.log('========================================');
    console.log('User:', req.user ? req.user._id : 'No user');
    console.log('File:', req.file ? req.file.originalname : 'No file');
    console.log('File type:', req.file ? req.file.mimetype : 'N/A');
    console.log('File size:', req.file ? `${(req.file.size / 1024).toFixed(2)} KB` : 'N/A');
    console.log('========================================');
    
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
    let noteId = null;
    let textContent = '';
    let extractionMethod = 'none';
    
    console.log('📄 Processing file type:', req.file.mimetype);
    
    // Use OCR-enabled text extraction
    console.log('🔄 Starting text extraction with OCR fallback...');
    const extraction = await extractTextWithOCR(
      req.file.buffer, 
      req.file.mimetype,
      'eng' // Language: English (can be made configurable)
    );
    
    textContent = extraction.text;
    extractionMethod = extraction.method;
    
    console.log(`✓ Extraction completed using: ${extractionMethod}`);
    console.log(`   Extracted: ${textContent.length} characters`);
    
    if (textContent.length > 0) {
      // Clean up the text (remove excessive whitespace)
      textContent = textContent.replace(/\s+/g, ' ').trim();
      console.log(`   After cleanup: ${textContent.length} characters`);
      console.log(`   Preview: ${textContent.substring(0, 200)}...`);
    } else {
      console.log('⚠️  No text extracted');
      if (extraction.error) {
        console.log(`   Error: ${extraction.error}`);
      }
    }
    
    // Save as note if we have text content (triggers RAG processing)
    // UPDATED: Create note even with minimal content to enable RAG
    if (textContent && textContent.trim().length > 50) {
      try {
        console.log('📝 Creating note for RAG processing...');
        console.log(`   User ID: ${req.user._id}`);
        console.log(`   File: ${req.file.originalname}`);
        console.log(`   Content length: ${textContent.length} characters`);
        
        const newNote = await Note.create({
          user: req.user._id,
          title: req.file.originalname,
          content: textContent,
          fileType: req.file.mimetype.startsWith('image/') ? 'text' : (req.file.mimetype === 'application/pdf' ? 'pdf' : 'text'),
          fileUrl: result.secure_url,
          originalFileName: req.file.originalname,
          fileSize: req.file.size,
          summary: 'Processing...'
        });
        noteId = newNote._id;
        console.log(`✅ Note created with ID: ${noteId}`);
        console.log('🔄 Starting background chunk processing...');
        
        // Start background chunk processing
        setImmediate(async () => {
          try {
            await processNoteChunks(noteId, req.user._id, textContent);
          } catch (error) {
            console.error('❌ Background chunk processing failed:', error.message);
            console.error('   Stack:', error.stack);
          }
        });
        
        aiSummary = `File uploaded and saved! Your note is being processed for intelligent search. ⏳ Please wait 15-20 seconds before asking questions to allow processing to complete.`;
      } catch (error) {
        console.error('❌ Note creation error:', error.message);
        console.error('   Stack:', error.stack);
        aiSummary = 'File uploaded but note creation failed. RAG features will not be available.';
      }
    } else {
      console.log('⚠️  No text content extracted or content too short (< 50 chars), skipping note creation');
      console.log(`   Content length: ${textContent.length}`);
      console.log(`   File type: ${req.file.mimetype}`);
      console.log(`   Extraction method: ${extractionMethod}`);
      console.log(`   Content preview: "${textContent.substring(0, 100)}"`);
      
      // Provide helpful message based on extraction method
      if (extractionMethod === 'ocr') {
        aiSummary = 'File uploaded successfully. OCR was used but extracted insufficient text for RAG. The file might have poor image quality or no readable text.';
      } else if (extractionMethod === 'error') {
        aiSummary = `File uploaded successfully, but text extraction failed: ${extraction.error || 'Unknown error'}. You can still view the file.`;
      } else if (req.file.mimetype.startsWith('image/')) {
        aiSummary = 'Image uploaded successfully, but OCR did not extract enough text for RAG. Try uploading an image with clearer text.';
      } else if (req.file.mimetype === 'application/pdf') {
        aiSummary = 'PDF uploaded successfully. OCR was attempted but no text could be extracted. The PDF might be empty or have very poor quality scans.';
      } else {
        aiSummary = 'File uploaded successfully, but no text content could be extracted for RAG features.';
      }
    }

    // Return the file information
    // Convert noteId to string for JSON serialization
    const noteIdString = noteId ? noteId.toString() : null;
    
    console.log('📤 Sending response to client:');
    console.log(`   NoteId: ${noteIdString || 'null'}`);
    console.log(`   RAG Enabled: ${noteIdString !== null}`);
    console.log(`   Has Text: ${textContent.length > 0}`);
    console.log(`   Extraction Method: ${extractionMethod}`);
    console.log(`   Text Content Preview: ${textContent.substring(0, 100)}...`);
    
    res.json({
      message: 'File uploaded successfully',
      file: {
        _id: result.public_id,
        filename: result.public_id,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: result.secure_url,
        cloudinary_id: result.public_id,
        resource_type: result.resource_type,
        created_at: result.created_at,
        summary: aiSummary,
        isImage: req.file.mimetype.startsWith('image/'),
        aiAnalyzed: extractionMethod === 'ocr' || extractionMethod === 'pdf-parse',
        noteId: noteIdString,
        hasText: textContent.length > 0,
        ragEnabled: noteIdString !== null,
        extractionMethod: extractionMethod // NEW: Show how text was extracted
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
