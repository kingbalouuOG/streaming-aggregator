/**
 * Content Embedding Generation
 * Converts content items into 32-dimensional vectors for similarity search
 */

import {
  VECTOR_DIMENSIONS,
  GENRE_INDEX_MAP,
  GENRE_WEIGHTS,
  POPULARITY_THRESHOLDS,
  RATING_THRESHOLDS,
  RECENCY_THRESHOLDS,
  CONTENT_TYPE_INDEX,
} from './constants';

/**
 * Generate a 32-dimensional embedding vector from content metadata
 * @param {Object} item - Content item from TMDb
 * @returns {number[]} 32-dimensional vector
 */
export const generateEmbedding = (item) => {
  const vector = new Array(VECTOR_DIMENSIONS).fill(0);

  // 1. Genre encoding (indices 0-17)
  encodeGenres(vector, item.genre_ids || []);

  // 2. Popularity encoding (indices 18-21)
  encodePopularity(vector, item.popularity || 0);

  // 3. Rating encoding (indices 22-25)
  encodeRating(vector, item.vote_average || 0);

  // 4. Recency encoding (indices 26-29)
  const releaseDate = item.release_date || item.first_air_date;
  encodeRecency(vector, releaseDate);

  // 5. Content type encoding (indices 30-31)
  encodeContentType(vector, item.type);

  return normalizeVector(vector);
};

/**
 * Encode genres with weighted values based on position
 * TMDb returns genres in order of relevance
 */
const encodeGenres = (vector, genreIds) => {
  genreIds.forEach((genreId, index) => {
    const vectorIndex = GENRE_INDEX_MAP[genreId];
    if (vectorIndex !== undefined) {
      // Weight based on position: primary > secondary > tertiary
      const weight = index === 0 ? GENRE_WEIGHTS.PRIMARY
        : index === 1 ? GENRE_WEIGHTS.SECONDARY
        : GENRE_WEIGHTS.TERTIARY;
      vector[vectorIndex] = weight;
    }
  });
};

/**
 * Encode popularity into buckets
 */
const encodePopularity = (vector, popularity) => {
  if (popularity > POPULARITY_THRESHOLDS.VIRAL) {
    vector[18] = 1.0;
  } else if (popularity > POPULARITY_THRESHOLDS.POPULAR) {
    vector[19] = 1.0;
  } else if (popularity > POPULARITY_THRESHOLDS.MODERATE) {
    vector[20] = 1.0;
  } else {
    vector[21] = 1.0;
  }
};

/**
 * Encode rating into buckets
 */
const encodeRating = (vector, rating) => {
  if (rating >= RATING_THRESHOLDS.EXCELLENT) {
    vector[22] = 1.0;
  } else if (rating >= RATING_THRESHOLDS.GOOD) {
    vector[23] = 1.0;
  } else if (rating >= RATING_THRESHOLDS.AVERAGE) {
    vector[24] = 1.0;
  } else {
    vector[25] = 1.0;
  }
};

/**
 * Encode recency based on release date
 */
const encodeRecency = (vector, releaseDateStr) => {
  if (!releaseDateStr) {
    vector[29] = 1.0; // Default to vintage if no date
    return;
  }

  const releaseDate = new Date(releaseDateStr);
  const today = new Date();
  const daysDiff = Math.floor((today - releaseDate) / (1000 * 60 * 60 * 24));

  if (daysDiff <= RECENCY_THRESHOLDS.NEW) {
    vector[26] = 1.0;
  } else if (daysDiff <= RECENCY_THRESHOLDS.RECENT) {
    vector[27] = 1.0;
  } else if (daysDiff <= RECENCY_THRESHOLDS.CLASSIC) {
    vector[28] = 1.0;
  } else {
    vector[29] = 1.0;
  }
};

/**
 * Encode content type (movie vs TV)
 */
const encodeContentType = (vector, type) => {
  if (type === 'movie') {
    vector[CONTENT_TYPE_INDEX.MOVIE] = 1.0;
  } else if (type === 'tv') {
    vector[CONTENT_TYPE_INDEX.TV] = 1.0;
  }
};

/**
 * Normalize vector to unit length (L2 normalization)
 * This ensures cosine similarity works correctly
 */
const normalizeVector = (vector) => {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;
  return vector.map(val => val / magnitude);
};

/**
 * Create a query vector for a specific genre
 * Used for finding content that matches a genre with degree of relevance
 * @param {number} genreId - TMDb genre ID
 * @returns {number[]} Query vector
 */
export const createGenreQueryVector = (genreId) => {
  const vector = new Array(VECTOR_DIMENSIONS).fill(0);
  const genreIndex = GENRE_INDEX_MAP[genreId];
  if (genreIndex !== undefined) {
    vector[genreIndex] = 1.0;
  }
  return normalizeVector(vector);
};

/**
 * Create a composite query vector from multiple criteria
 * @param {Object} criteria - Query criteria
 * @param {number[]} criteria.genres - Genre IDs
 * @param {string} criteria.popularityBucket - 'viral' | 'popular' | 'moderate' | 'niche'
 * @param {string} criteria.ratingBucket - 'excellent' | 'good' | 'average' | 'below'
 * @param {string} criteria.recencyBucket - 'new' | 'recent' | 'classic' | 'vintage'
 * @param {string} criteria.contentType - 'movie' | 'tv'
 * @returns {number[]} Query vector
 */
export const createQueryVector = (criteria = {}) => {
  const vector = new Array(VECTOR_DIMENSIONS).fill(0);

  // Genres
  if (criteria.genres) {
    criteria.genres.forEach((genreId, index) => {
      const genreIndex = GENRE_INDEX_MAP[genreId];
      if (genreIndex !== undefined) {
        const weight = index === 0 ? 1.0 : index === 1 ? 0.6 : 0.3;
        vector[genreIndex] = weight;
      }
    });
  }

  // Popularity
  const popMap = { viral: 18, popular: 19, moderate: 20, niche: 21 };
  if (criteria.popularityBucket && popMap[criteria.popularityBucket]) {
    vector[popMap[criteria.popularityBucket]] = 1.0;
  }

  // Rating
  const ratingMap = { excellent: 22, good: 23, average: 24, below: 25 };
  if (criteria.ratingBucket && ratingMap[criteria.ratingBucket]) {
    vector[ratingMap[criteria.ratingBucket]] = 1.0;
  }

  // Recency
  const recencyMap = { new: 26, recent: 27, classic: 28, vintage: 29 };
  if (criteria.recencyBucket && recencyMap[criteria.recencyBucket]) {
    vector[recencyMap[criteria.recencyBucket]] = 1.0;
  }

  // Content type
  if (criteria.contentType === 'movie') {
    vector[30] = 1.0;
  } else if (criteria.contentType === 'tv') {
    vector[31] = 1.0;
  }

  return normalizeVector(vector);
};

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} a - First vector
 * @param {number[]} b - Second vector
 * @returns {number} Similarity score (0 to 1)
 */
export const cosineSimilarity = (a, b) => {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
};
