// Export TMDb API functions
export {
  getConfiguration,
  discoverMovies,
  discoverTV,
  getMovieDetails,
  getTVDetails,
  searchMulti,
  getWatchProviders,
  buildImageUrl,
  buildPosterUrl,
  buildBackdropUrl,
  buildLogoUrl,
} from './tmdb';

// Export OMDB API functions
export {
  getRatings,
  getRottenTomatoesScore,
  getIMDbScore,
  getMetacriticScore,
} from './omdb';

// Export cache functions
export {
  getCachedData,
  setCachedData,
  clearCache,
  clearExpired,
  getCacheStats,
  createTMDbCacheKey,
  createOMDbCacheKey,
  CACHE_PREFIXES,
  CACHE_TTL,
} from './cache';

// Default exports
import TMDbAPI from './tmdb';
import OMDbAPI from './omdb';
import CacheAPI from './cache';

export { TMDbAPI, OMDbAPI, CacheAPI };
