const Tesseract = require('tesseract.js');
const { fromBuffer } = require('pdf2pic');
const pdf = require('pdf-parse');

/**
 * Extract text from image using Tesseract OCR
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} language - Language code (default: 'eng')
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromImage(imageBuffer, language = 'eng') {
  try {
    console.log('🔍 Starting OCR on image...');
    console.log(`   Language: ${language}`);
    console.log(`   Buffer size: ${imageBuffer.length} bytes`);
    
    const { data: { text, confidence } } = await Tesseract.recognize(
      imageBuffer,
      language,
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`   OCR progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );
    
    console.log(`✓ OCR completed with ${confidence.toFixed(2)}% confidence`);
    console.log(`   Extracted ${text.length} characters`);
    
    return text.trim();
  } catch (error) {
    console.error('❌ OCR error:', error.message);
    throw error;
  }
}

/**
 * Check if PDF has extractable text and extract with layout preservation
 * @param {Buffer} pdfBuffer - PDF buffer
 * @returns {Promise<{hasText: boolean, text: string, pageCount: number}>}
 */
async function checkPDFText(pdfBuffer) {
  try {
    // Custom render function to preserve layout (including tables)
    const options = {
      // Preserve spacing and layout
      normalizeWhitespace: false,
      disableCombineTextItems: false
    };
    
    const data = await pdf(pdfBuffer, options);
    
    // Post-process to improve table formatting
    let text = data.text || '';
    
    // Try to detect and format tables better
    // Look for patterns like multiple spaces (table columns)
    text = text
      .split('\n')
      .map(line => {
        // If line has multiple consecutive spaces (likely table columns)
        if (line.match(/\s{3,}/)) {
          // Replace multiple spaces with pipe separators for better structure
          return line.replace(/\s{3,}/g, ' | ');
        }
        return line;
      })
      .join('\n');
    
    const hasText = text && text.trim().length > 50;
    
    return {
      hasText,
      text: text,
      pageCount: data.numpages || 0
    };
  } catch (error) {
    console.error('Error checking PDF text:', error.message);
    return {
      hasText: false,
      text: '',
      pageCount: 0
    };
  }
}

/**
 * Extract text from scanned PDF using OCR
 * Converts PDF pages to images and runs OCR on each
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {string} language - Language code (default: 'eng')
 * @returns {Promise<string>} Extracted text from all pages
 */
async function extractTextFromScannedPDF(pdfBuffer, language = 'eng') {
  try {
    console.log('🔍 Starting OCR on scanned PDF...');
    
    // First check if PDF has text
    const pdfCheck = await checkPDFText(pdfBuffer);
    
    if (pdfCheck.hasText) {
      console.log('✓ PDF already has extractable text, skipping OCR');
      return pdfCheck.text;
    }
    
    console.log(`   PDF has ${pdfCheck.pageCount} pages`);
    console.log('   No text found, proceeding with OCR...');
    
    // Convert PDF to images
    const options = {
      density: 200,           // DPI
      saveFilename: "page",
      savePath: "./temp",
      format: "png",
      width: 2000,
      height: 2000
    };
    
    const convert = fromBuffer(pdfBuffer, options);
    
    // Process first 5 pages (to avoid timeout)
    const maxPages = Math.min(pdfCheck.pageCount || 5, 5);
    const extractedTexts = [];
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        console.log(`   Processing page ${pageNum}/${maxPages}...`);
        
        const pageImage = await convert(pageNum, { responseType: 'buffer' });
        const pageText = await extractTextFromImage(pageImage.buffer, language);
        
        if (pageText && pageText.length > 10) {
          extractedTexts.push(`[Page ${pageNum}]\n${pageText}`);
          console.log(`   ✓ Page ${pageNum}: ${pageText.length} characters`);
        } else {
          console.log(`   ⚠️  Page ${pageNum}: No text found`);
        }
      } catch (pageError) {
        console.error(`   ❌ Error on page ${pageNum}:`, pageError.message);
        // Continue with next page
      }
    }
    
    if (extractedTexts.length === 0) {
      console.log('⚠️  No text extracted from any page');
      return '';
    }
    
    const fullText = extractedTexts.join('\n\n');
    console.log(`✓ OCR completed: ${fullText.length} total characters from ${extractedTexts.length} pages`);
    
    return fullText;
  } catch (error) {
    console.error('❌ PDF OCR error:', error.message);
    throw error;
  }
}

/**
 * Extract text with automatic fallback to OCR
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - File MIME type
 * @param {string} language - Language code (default: 'eng')
 * @returns {Promise<{text: string, method: string}>}
 */
async function extractTextWithOCR(buffer, mimeType, language = 'eng') {
  try {
    // For images, use OCR directly
    if (mimeType.startsWith('image/')) {
      console.log('📸 Image detected, using OCR...');
      const text = await extractTextFromImage(buffer, language);
      return {
        text,
        method: 'ocr'
      };
    }
    
    // For PDFs, try text extraction first, then OCR
    if (mimeType === 'application/pdf') {
      console.log('📄 PDF detected, checking for text...');
      
      const pdfCheck = await checkPDFText(buffer);
      
      if (pdfCheck.hasText) {
        console.log('✓ Using native PDF text extraction');
        return {
          text: pdfCheck.text,
          method: 'pdf-parse'
        };
      }
      
      console.log('⚠️  PDF has no text layer, using OCR...');
      const text = await extractTextFromScannedPDF(buffer, language);
      return {
        text,
        method: 'ocr'
      };
    }
    
    // For text files
    if (mimeType === 'text/plain') {
      const text = buffer.toString('utf-8');
      return {
        text,
        method: 'direct'
      };
    }
    
    return {
      text: '',
      method: 'unsupported'
    };
  } catch (error) {
    console.error('❌ Text extraction error:', error.message);
    return {
      text: '',
      method: 'error',
      error: error.message
    };
  }
}

module.exports = {
  extractTextFromImage,
  extractTextFromScannedPDF,
  extractTextWithOCR,
  checkPDFText
};
