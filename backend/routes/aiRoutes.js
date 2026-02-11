const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const {
  analyzeImage,
  analyzeMultipleImages,
  extractTextFromImage
} = require('../controllers/aiController');

const router = express.Router();

// Validation middleware for single image analysis
const validateImageAnalysis = [
  body('imageUrl')
    .isURL()
    .withMessage('Valid image URL is required'),
  body('publicId')
    .optional()
    .notEmpty()
    .withMessage('Public ID cannot be empty if provided')
];

// Validation middleware for multiple image analysis
const validateMultipleImageAnalysis = [
  body('images')
    .isArray({ min: 1 })
    .withMessage('Images array is required and must contain at least one image'),
  body('images.*.imageUrl')
    .isURL()
    .withMessage('Each image must have a valid URL'),
  body('images.*.publicId')
    .optional()
    .notEmpty()
    .withMessage('Public ID cannot be empty if provided')
];

// Validation middleware for text extraction
const validateTextExtraction = [
  body('imageUrl')
    .isURL()
    .withMessage('Valid image URL is required'),
  body('publicId')
    .optional()
    .notEmpty()
    .withMessage('Public ID cannot be empty if provided')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// POST /api/ai/analyze-image - Analyze a single image
router.post('/analyze-image', 
  auth, 
  validateImageAnalysis, 
  handleValidationErrors, 
  analyzeImage
);

// POST /api/ai/analyze-multiple - Analyze multiple images
router.post('/analyze-multiple', 
  auth, 
  validateMultipleImageAnalysis, 
  handleValidationErrors, 
  analyzeMultipleImages
);

// POST /api/ai/extract-text - Extract text from image (OCR)
router.post('/extract-text', 
  auth, 
  validateTextExtraction, 
  handleValidationErrors, 
  extractTextFromImage
);

// GET /api/ai/health - Health check for AI service
router.get('/health', auth, (req, res) => {
  res.json({
    success: true,
    message: 'AI service is running',
    services: {
      gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not configured',
      cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'not configured'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;