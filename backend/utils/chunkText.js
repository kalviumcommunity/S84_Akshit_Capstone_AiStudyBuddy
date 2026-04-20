/**
 * Split text into chunks with overlap for better context preservation
 * Uses sentence-aware chunking to avoid breaking mid-sentence
 * @param {string} text - The text to chunk
 * @param {number} chunkSize - Target words per chunk (default: 400)
 * @param {number} overlap - Overlap words between chunks (default: 50)
 * @returns {Array<string>} Array of text chunks
 */
function chunkText(text, chunkSize = 400, overlap = 50) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Clean and normalize text
  const cleanedText = text.trim().replace(/\s+/g, ' ');
  
  if (!cleanedText) {
    return [];
  }

  // Split into sentences using regex (matches .!? followed by space or end)
  const sentenceRegex = /[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g;
  const sentences = cleanedText.match(sentenceRegex) || [cleanedText];
  
  // If text is small, return as single chunk
  const totalWords = cleanedText.split(' ').length;
  if (totalWords <= chunkSize) {
    return [cleanedText];
  }

  const chunks = [];
  let currentChunk = [];
  let currentWordCount = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    const sentenceWords = sentence.split(' ').length;

    // If adding this sentence exceeds chunk size and we have content
    if (currentWordCount + sentenceWords > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push(currentChunk.join(' '));
      
      // Start new chunk with overlap
      // Go back and include last few sentences for overlap
      const overlapSentences = [];
      let overlapWords = 0;
      
      for (let j = currentChunk.length - 1; j >= 0 && overlapWords < overlap; j--) {
        const prevSentence = currentChunk[j];
        const prevWords = prevSentence.split(' ').length;
        if (overlapWords + prevWords <= overlap) {
          overlapSentences.unshift(prevSentence);
          overlapWords += prevWords;
        } else {
          break;
        }
      }
      
      currentChunk = overlapSentences;
      currentWordCount = overlapWords;
    }

    // Add current sentence
    currentChunk.push(sentence);
    currentWordCount += sentenceWords;
  }

  // Add final chunk if it has content
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

module.exports = { chunkText };
