/**
 * Vector Database Constants
 * Configuration for content vectorization and similarity matching
 */

// Total vector dimensions
export const VECTOR_DIMENSIONS = 32;

// Genre IDs mapped to vector indices (0-17)
export const GENRE_INDEX_MAP = {
  28: 0,      // Action
  12: 1,      // Adventure
  16: 2,      // Animation
  35: 3,      // Comedy
  80: 4,      // Crime
  99: 5,      // Documentary
  18: 6,      // Drama
  10751: 7,   // Family
  14: 8,      // Fantasy
  36: 9,      // History
  27: 10,     // Horror
  10402: 11,  // Music
  9648: 12,   // Mystery
  10749: 13,  // Romance
  878: 14,    // Sci-Fi
  53: 15,     // Thriller
  10752: 16,  // War
  37: 17,     // Western
};

// Weight for genre encoding based on position in TMDb genre_ids array
export const GENRE_WEIGHTS = {
  PRIMARY: 1.0,    // First genre in list
  SECONDARY: 0.6,  // Second genre
  TERTIARY: 0.3,   // Third and beyond
};

// Popularity buckets (indices 18-21)
export const POPULARITY_THRESHOLDS = {
  VIRAL: 100,     // Index 18: popularity > 100
  POPULAR: 50,    // Index 19: popularity > 50
  MODERATE: 20,   // Index 20: popularity > 20
  NICHE: 0,       // Index 21: all others
};

// Rating buckets (indices 22-25)
export const RATING_THRESHOLDS = {
  EXCELLENT: 8.0, // Index 22: rating >= 8
  GOOD: 6.5,      // Index 23: rating >= 6.5
  AVERAGE: 5.0,   // Index 24: rating >= 5
  BELOW: 0,       // Index 25: all others
};

// Recency buckets (indices 26-29) - in days from today
export const RECENCY_THRESHOLDS = {
  NEW: 90,        // Index 26: released within 90 days
  RECENT: 365,    // Index 27: released within 1 year
  CLASSIC: 1825,  // Index 28: released within 5 years
  VINTAGE: 36500, // Index 29: older than 5 years
};

// Content type encoding (indices 30-31)
export const CONTENT_TYPE_INDEX = {
  MOVIE: 30,
  TV: 31,
};

// Similarity thresholds for genre matching
export const SIMILARITY_THRESHOLDS = {
  STRONG_MATCH: 0.7,   // Highly relevant to genre
  PARTIAL_MATCH: 0.5,  // Somewhat relevant
  WEAK_MATCH: 0.3,     // Loosely related
};

// AsyncStorage key for vector index
export const VECTOR_STORAGE_KEY = '@vector_index';

// Maximum items to keep in index (for memory management)
export const MAX_INDEX_SIZE = 5000;
