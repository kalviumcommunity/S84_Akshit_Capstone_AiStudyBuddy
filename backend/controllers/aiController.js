const { GoogleGenerativeAI } = require('@google/generative-ai');
const cloudinary = require('../config/cloudinary');
const fetch = require('node-fetch');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to convert image URL to base64
const getImageFromUrl = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return base64;
  } catch (error) {
    throw new Error(`Failed to fetch image: ${error.message}`);
  }
};

// Analyze image and generate summary
const analyzeImage = async (req, res) => {
  try {
    const { imageUrl, publicId } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        error: 'Image URL is required',
        message: 'Please provide a valid image URL'
      });
    }

    console.log('Starting image analysis for:', publicId || imageUrl);

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Convert image URL to base64
    const imageBase64 = await getImageFromUrl(imageUrl);

    // Create the prompt for image analysis
    const prompt = `
    Analyze this image and provide a comprehensive summary for study purposes. Include:
    
    1. **Main Content**: What is the primary subject or content of this image?
    2. **Key Information**: Extract any text, diagrams, charts, or important visual elements
    3. **Study Notes**: Identify key concepts, formulas, or important points that would be useful for studying
    4. **Context**: What subject area or topic does this appear to relate to?
    5. **Summary**: Provide a concise summary that would help someone understand and remember the content
    
    Please format your response in a clear, structured way that would be helpful for a student.
    `;

    // Analyze the image
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg" // Cloudinary typically serves as JPEG
        }
      }
    ]);

    const response = await result.response;
    const summary = response.text();

    console.log('Image analysis completed successfully');

    // Return the analysis result
    res.json({
      success: true,
      message: 'Image analyzed successfully',
      analysis: {
        publicId: publicId,
        imageUrl: imageUrl,
        summary: summary,
        analyzedAt: new Date().toISOString(),
        aiModel: 'gemini-2.5-flash'
      }
    });

  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({
      error: 'Image analysis failed',
      message: error.message
    });
  }
};

// Analyze multiple images
const analyzeMultipleImages = async (req, res) => {
  try {
    const { images } = req.body; // Array of {imageUrl, publicId}

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        error: 'Images array is required',
        message: 'Please provide an array of images to analyze'
      });
    }

    console.log(`Starting batch analysis for ${images.length} images`);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const results = [];

    // Process each image
    for (const image of images) {
      try {
        const imageBase64 = await getImageFromUrl(image.imageUrl);
        
        const prompt = `
        Analyze this image and provide a brief study summary. Focus on:
        1. Main content and key information
        2. Important concepts or formulas
        3. Subject area
        4. Brief summary for study notes
        
        Keep the response concise but informative.
        `;

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: imageBase64,
              mimeType: "image/jpeg"
            }
          }
        ]);

        const response = await result.response;
        const summary = response.text();

        results.push({
          publicId: image.publicId,
          imageUrl: image.imageUrl,
          summary: summary,
          success: true
        });

      } catch (error) {
        console.error(`Error analyzing image ${image.publicId}:`, error);
        results.push({
          publicId: image.publicId,
          imageUrl: image.imageUrl,
          error: error.message,
          success: false
        });
      }
    }

    res.json({
      success: true,
      message: `Analyzed ${results.filter(r => r.success).length} out of ${images.length} images`,
      results: results,
      analyzedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch image analysis error:', error);
    res.status(500).json({
      error: 'Batch image analysis failed',
      message: error.message
    });
  }
};

// Extract text from image (OCR functionality)
const extractTextFromImage = async (req, res) => {
  try {
    const { imageUrl, publicId } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        error: 'Image URL is required',
        message: 'Please provide a valid image URL'
      });
    }

    console.log('Starting text extraction for:', publicId || imageUrl);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const imageBase64 = await getImageFromUrl(imageUrl);

    const prompt = `
    Extract all text content from this image. Please:
    1. Transcribe all visible text accurately
    2. Maintain the original formatting and structure where possible
    3. If there are mathematical formulas, equations, or special symbols, describe them clearly
    4. If the text is handwritten, do your best to interpret it
    5. Organize the extracted text in a logical, readable format
    
    Return only the extracted text content without additional commentary.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const response = await result.response;
    const extractedText = response.text();

    res.json({
      success: true,
      message: 'Text extracted successfully',
      extraction: {
        publicId: publicId,
        imageUrl: imageUrl,
        extractedText: extractedText,
        extractedAt: new Date().toISOString(),
        aiModel: 'gemini-2.5-flash'
      }
    });

  } catch (error) {
    console.error('Text extraction error:', error);
    res.status(500).json({
      error: 'Text extraction failed',
      message: error.message
    });
  }
};

module.exports = {
  analyzeImage,
  analyzeMultipleImages,
  extractTextFromImage
};