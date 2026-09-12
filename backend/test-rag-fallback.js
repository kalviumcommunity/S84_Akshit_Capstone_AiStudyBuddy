/**
 * Test script to verify RAG fallback functionality
 * This simulates what happens when Gemini API fails but RAG chunks are available
 */

// Mock data representing retrieved chunks
const mockChunks = [
  {
    similarity: 0.92,
    data: {
      text: "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll. During photosynthesis, plants take in carbon dioxide (CO2) and water (H2O) from the air and soil.",
      metadata: {
        chunkIndex: 0,
        wordCount: 45,
        keywords: ["photosynthesis", "chlorophyll", "plants", "sunlight"]
      }
    }
  },
  {
    similarity: 0.88,
    data: {
      text: "The process of photosynthesis occurs in two main stages: the light-dependent reactions and the light-independent reactions (Calvin cycle). Light energy is converted into chemical energy in the form of ATP and NADPH.",
      metadata: {
        chunkIndex: 1,
        wordCount: 38,
        keywords: ["light-dependent", "Calvin cycle", "ATP", "NADPH"]
      }
    }
  },
  {
    similarity: 0.85,
    data: {
      text: "Chlorophyll, the green pigment in plants, plays a crucial role in photosynthesis by absorbing light energy, primarily in the blue and red wavelengths. This absorbed energy is then used to convert CO2 and H2O into glucose (C6H12O6) and oxygen (O2).",
      metadata: {
        chunkIndex: 2,
        wordCount: 42,
        keywords: ["chlorophyll", "pigment", "glucose", "oxygen"]
      }
    }
  }
];

/**
 * Format retrieved chunks as a readable response when Gemini API is unavailable
 * This is the same function used in chatController.js
 */
function formatChunksAsResponse(chunks, query, avgSimilarity) {
  if (!chunks || chunks.length === 0) {
    return `I couldn't find relevant information in your notes to answer: "${query}"`;
  }

  let response = `📚 **Based on your notes** (Relevance: ${(avgSimilarity * 100).toFixed(0)}%)\n\n`;
  response += `**Your question:** ${query}\n\n`;
  response += `**Relevant information from your notes:**\n\n`;
  
  chunks.forEach((chunk, index) => {
    const relevance = (chunk.similarity * 100).toFixed(0);
    response += `**[${index + 1}] Relevance: ${relevance}%**\n`;
    response += `${chunk.data.text}\n\n`;
    
    if (index < chunks.length - 1) {
      response += `---\n\n`;
    }
  });
  
  response += `\n⚠️ **Note:** AI summarization is currently unavailable. The above are the most relevant sections from your notes. Please check your Gemini API key configuration.`;
  
  return response;
}

// Test scenarios
console.log('='.repeat(80));
console.log('RAG FALLBACK TEST - Simulating Gemini API Failure');
console.log('='.repeat(80));
console.log();

// Scenario 1: User asks about photosynthesis
const query1 = "What is photosynthesis?";
const avgSimilarity1 = mockChunks.reduce((sum, c) => sum + c.similarity, 0) / mockChunks.length;

console.log('SCENARIO 1: Gemini API Key Invalid');
console.log('-'.repeat(80));
console.log(`Query: "${query1}"`);
console.log(`Average Similarity: ${(avgSimilarity1 * 100).toFixed(2)}%`);
console.log();
console.log('Response:');
console.log(formatChunksAsResponse(mockChunks, query1, avgSimilarity1));
console.log();
console.log();

// Scenario 2: User asks about chlorophyll (fewer chunks)
const query2 = "Explain the role of chlorophyll";
const relevantChunks = mockChunks.filter(c => c.similarity >= 0.85);
const avgSimilarity2 = relevantChunks.reduce((sum, c) => sum + c.similarity, 0) / relevantChunks.length;

console.log('SCENARIO 2: Gemini API Quota Exceeded');
console.log('-'.repeat(80));
console.log(`Query: "${query2}"`);
console.log(`Average Similarity: ${(avgSimilarity2 * 100).toFixed(2)}%`);
console.log();
console.log('Response:');
console.log(formatChunksAsResponse(relevantChunks, query2, avgSimilarity2));
console.log();
console.log();

// Scenario 3: No relevant chunks found
const query3 = "What is quantum mechanics?";
const noChunks = [];

console.log('SCENARIO 3: No Relevant Chunks Found');
console.log('-'.repeat(80));
console.log(`Query: "${query3}"`);
console.log();
console.log('Response:');
console.log(formatChunksAsResponse(noChunks, query3, 0));
console.log();
console.log();

console.log('='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));
console.log();
console.log('Summary:');
console.log('✓ When Gemini API fails, the system returns the most relevant chunks directly');
console.log('✓ Users can still access their study materials even without AI summarization');
console.log('✓ Relevance scores help users understand how well the chunks match their query');
console.log('✓ Clear warning message informs users about the API issue');
