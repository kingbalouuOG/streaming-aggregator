/**
 * Vector Database Module
 *
 * Provides vector-based content indexing and similarity search
 * for enhanced genre matching and recommendations.
 *
 * Usage Example:
 * ```javascript
 * import vectorStore, { generateEmbedding, createGenreQueryVector } from '../vector';
 *
 * // Index content after fetching from TMDb
 * await vectorStore.indexItems(contentArray);
 *
 * // Find content similar to a genre with degree of match
 * const actionContent = await vectorStore.findByGenre(28, 0.5, 20);
 *
 * // Create custom query for recommendations
 * const queryVector = createQueryVector({
 *   genres: [28, 12], // Action, Adventure
 *   popularityBucket: 'popular',
 *   ratingBucket: 'good',
 * });
 * const similar = await vectorStore.findSimilar(queryVector, 20);
 * ```
 */

// Main vector store instance
export { default as vectorStore } from './vectorStore';
export { default } from './vectorStore';

// Embedding functions
export {
  generateEmbedding,
  createGenreQueryVector,
  createQueryVector,
  cosineSimilarity,
} from './embeddings';

// Constants
export {
  VECTOR_DIMENSIONS,
  GENRE_INDEX_MAP,
  GENRE_WEIGHTS,
  SIMILARITY_THRESHOLDS,
} from './constants';
