/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vectorA - First embedding vector
 * @param {Array<number>} vectorB - Second embedding vector
 * @returns {number} Similarity score between -1 and 1 (higher is more similar)
 */
function cosineSimilarity(vectorA, vectorB) {
  if (!Array.isArray(vectorA) || !Array.isArray(vectorB)) {
    throw new Error('Both inputs must be arrays');
  }

  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same length');
  }

  if (vectorA.length === 0) {
    throw new Error('Vectors cannot be empty');
  }

  // Calculate dot product
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }

  // Calculate magnitudes
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  // Avoid division by zero
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  // Calculate cosine similarity
  const similarity = dotProduct / (magnitudeA * magnitudeB);

  return similarity;
}

/**
 * Find top K most similar items based on cosine similarity
 * @param {Array<number>} queryVector - Query embedding vector
 * @param {Array<{embedding: Array<number>, data: any}>} items - Items with embeddings
 * @param {number} topK - Number of top results to return (default: 5)
 * @param {number} minSimilarity - Minimum similarity threshold (default: 0.3)
 * @returns {Array<{similarity: number, data: any}>} Top K similar items with scores
 */
function findTopSimilar(queryVector, items, topK = 5, minSimilarity = 0.3) {
  if (!Array.isArray(queryVector) || queryVector.length === 0) {
    throw new Error('Invalid query vector');
  }

  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  // Calculate similarity for each item
  const similarities = items.map(item => {
    try {
      const similarity = cosineSimilarity(queryVector, item.embedding);
      return {
        similarity,
        data: item.data
      };
    } catch (error) {
      console.error('Error calculating similarity:', error);
      return {
        similarity: 0,
        data: item.data
      };
    }
  });

  // Filter by minimum similarity and sort descending
  const filtered = similarities
    .filter(item => item.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity);

  // Return top K results
  return filtered.slice(0, topK);
}

module.exports = { cosineSimilarity, findTopSimilar };
