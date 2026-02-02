/**
 * Vector Store
 * Manages content vectors for similarity-based recommendations
 * Uses a simple in-memory store with AsyncStorage persistence
 *
 * Note: For production, consider using Vectra (npm install vectra) for
 * more sophisticated vector operations. This implementation provides
 * a pure-JS alternative that works with Expo without native modules.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateEmbedding, cosineSimilarity } from './embeddings';
import { VECTOR_STORAGE_KEY, MAX_INDEX_SIZE } from './constants';

const DEBUG = __DEV__;

class VectorStore {
  constructor() {
    this.index = new Map(); // Map<string, { vector: number[], metadata: object }>
    this.initialized = false;
  }

  /**
   * Initialize the vector store by loading from AsyncStorage
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(VECTOR_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.index = new Map(Object.entries(parsed));
        if (DEBUG) {
          console.log(`[VectorStore] Loaded ${this.index.size} vectors from storage`);
        }
      }
      this.initialized = true;
    } catch (error) {
      console.error('[VectorStore] Error initializing:', error);
      this.index = new Map();
      this.initialized = true;
    }
  }

  /**
   * Index a content item
   * @param {Object} item - Content item from TMDb
   */
  async indexItem(item) {
    await this.initialize();

    const id = `${item.type}-${item.id}`;
    const vector = generateEmbedding(item);
    const metadata = {
      tmdbId: item.id,
      type: item.type,
      title: item.title || item.name,
      genres: item.genre_ids || [],
      popularity: item.popularity || 0,
      voteAverage: item.vote_average || 0,
      posterPath: item.poster_path,
    };

    this.index.set(id, { vector, metadata });

    // Enforce max size (LRU-style eviction)
    if (this.index.size > MAX_INDEX_SIZE) {
      const firstKey = this.index.keys().next().value;
      this.index.delete(firstKey);
    }
  }

  /**
   * Index multiple content items
   * @param {Object[]} items - Array of content items
   */
  async indexItems(items) {
    await this.initialize();

    for (const item of items) {
      await this.indexItem(item);
    }

    // Persist after batch indexing
    await this.persist();

    if (DEBUG) {
      console.log(`[VectorStore] Indexed ${items.length} items, total: ${this.index.size}`);
    }
  }

  /**
   * Find similar content using cosine similarity
   * @param {number[]} queryVector - Query vector
   * @param {number} topK - Number of results to return
   * @param {Set<string>} excludeIds - IDs to exclude from results
   * @returns {Array<{ id: string, score: number, metadata: object }>}
   */
  async findSimilar(queryVector, topK = 20, excludeIds = new Set()) {
    await this.initialize();

    const results = [];

    for (const [id, { vector, metadata }] of this.index) {
      if (excludeIds.has(id)) continue;

      const score = cosineSimilarity(queryVector, vector);
      results.push({ id, score, metadata });
    }

    // Sort by similarity score (descending) and take top K
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * Find content by genre with degree of match
   * @param {number} genreId - TMDb genre ID
   * @param {number} minSimilarity - Minimum similarity threshold
   * @param {number} topK - Number of results
   * @param {Set<string>} excludeIds - IDs to exclude
   */
  async findByGenre(genreId, minSimilarity = 0.3, topK = 30, excludeIds = new Set()) {
    const { createGenreQueryVector } = await import('./embeddings');
    const queryVector = createGenreQueryVector(genreId);
    const results = await this.findSimilar(queryVector, topK * 2, excludeIds);

    // Filter by minimum similarity and add match score
    return results
      .filter(r => r.score >= minSimilarity)
      .slice(0, topK)
      .map(r => ({
        ...r.metadata,
        matchScore: r.score,
      }));
  }

  /**
   * Get a vector by ID
   * @param {string} id - Content ID (format: "type-tmdbId")
   */
  async getVector(id) {
    await this.initialize();
    const entry = this.index.get(id);
    return entry ? entry.vector : null;
  }

  /**
   * Check if an item is indexed
   * @param {string} id - Content ID
   */
  async has(id) {
    await this.initialize();
    return this.index.has(id);
  }

  /**
   * Get the current index size
   */
  async size() {
    await this.initialize();
    return this.index.size;
  }

  /**
   * Persist the index to AsyncStorage
   */
  async persist() {
    try {
      const obj = Object.fromEntries(this.index);
      await AsyncStorage.setItem(VECTOR_STORAGE_KEY, JSON.stringify(obj));
      if (DEBUG) {
        console.log(`[VectorStore] Persisted ${this.index.size} vectors`);
      }
    } catch (error) {
      console.error('[VectorStore] Error persisting:', error);
    }
  }

  /**
   * Clear the entire index
   */
  async clear() {
    this.index = new Map();
    await AsyncStorage.removeItem(VECTOR_STORAGE_KEY);
    if (DEBUG) {
      console.log('[VectorStore] Index cleared');
    }
  }
}

// Export singleton instance
export default new VectorStore();
