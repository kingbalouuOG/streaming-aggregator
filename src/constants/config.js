/**
 * Application Configuration Constants
 * Centralized configuration for the StreamingAggregator app
 */

// Default region for streaming content
export const DEFAULT_REGION = 'GB';

// API and data fetching configuration
export const API_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_BATCH_SIZE: 10,
  DEBOUNCE_DELAY_MS: 300,
  THROTTLE_DELAY_MS: 500,
};

// Cache configuration
export const CACHE_CONFIG = {
  MAX_ENTRIES: 1000,
  TMDB_TTL_HOURS: 24,
  OMDB_TTL_DAYS: 7,
  WATCHMODE_TTL_HOURS: 24,
};

// Special genre IDs used in the application
export const SPECIAL_GENRE_IDS = {
  DOCUMENTARY: 99,
};

// Content sort options
export const SORT_OPTIONS = {
  POPULARITY_DESC: 'popularity.desc',
  VOTE_AVERAGE_DESC: 'vote_average.desc',
  RELEASE_DATE_DESC: 'release_date.desc',
  FIRST_AIR_DATE_DESC: 'first_air_date.desc',
};

// Minimum vote count for reliable ratings
export const MIN_VOTE_COUNT = 100;

// Content filter options
export const CONTENT_TYPES = {
  ALL: 'all',
  MOVIES: 'movies',
  TV: 'tv',
  DOCUMENTARIES: 'documentaries',
};

export const COST_FILTERS = {
  ALL: 'all',
  FREE: 'free',      // Subscription-based
  PAID: 'paid',      // Rent/Buy only
};
