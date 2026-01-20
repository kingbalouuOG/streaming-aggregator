import axios from 'axios';
import { TMDB_API_KEY } from '@env';
import { getCachedData, setCachedData, createTMDbCacheKey } from './cache';
import { logError, ErrorType } from '../utils/errorHandler';

const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = TMDB_API_KEY;

const DEBUG = __DEV__; // Enable logging in development mode
const USE_CACHE = true; // Enable/disable caching

// Create axios instance with default config
const tmdbClient = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor for logging
tmdbClient.interceptors.request.use(
  (config) => {
    if (DEBUG) {
      console.log('[TMDb Request]', config.method?.toUpperCase(), config.url, config.params);
    }
    return config;
  },
  (error) => {
    if (DEBUG) {
      console.error('[TMDb Request Error]', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor for logging
tmdbClient.interceptors.response.use(
  (response) => {
    if (DEBUG) {
      console.log('[TMDb Response]', response.config.url, 'Status:', response.status);
    }
    return response;
  },
  (error) => {
    if (DEBUG) {
      console.error('[TMDb Response Error]', error.config?.url, error.response?.status, error.message);
    }
    return Promise.reject(handleTMDbError(error));
  }
);

// Enhanced error handler
const handleTMDbError = (error) => {
  let enhancedError;

  if (error.response) {
    // API responded with error status
    const { status, data } = error.response;
    const message = data?.status_message || 'TMDb API error';

    switch (status) {
      case 401:
        enhancedError = new Error('Invalid API key. Please check your TMDb API key configuration.');
        enhancedError.code = ErrorType.AUTHENTICATION;
        break;
      case 404:
        enhancedError = new Error('Resource not found.');
        enhancedError.code = ErrorType.API;
        break;
      case 429:
        enhancedError = new Error('Too many requests. Please try again later.');
        enhancedError.code = ErrorType.RATE_LIMIT;
        break;
      default:
        enhancedError = new Error(`TMDb API Error: ${message}`);
        enhancedError.code = ErrorType.API;
    }
    enhancedError.status = status;
  } else if (error.request) {
    // Request made but no response
    enhancedError = new Error('Network error. Please check your internet connection.');
    enhancedError.code = ErrorType.NETWORK;
  } else {
    // Error setting up request
    enhancedError = new Error(error.message || 'An unexpected error occurred.');
    enhancedError.code = ErrorType.UNKNOWN;
  }

  // Log error
  logError(enhancedError, 'TMDb API');

  return enhancedError;
};

// Configuration endpoint (call once at app start)
export const getConfiguration = async () => {
  try {
    // Check cache first
    if (USE_CACHE) {
      const cacheKey = createTMDbCacheKey('configuration', {});
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
        };
      }
    }

    const response = await tmdbClient.get('/configuration');

    // Cache the response
    if (USE_CACHE) {
      const cacheKey = createTMDbCacheKey('configuration', {});
      await setCachedData(cacheKey, response.data);
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('TMDb Configuration Error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Discover movies
export const discoverMovies = async (params = {}) => {
  try {
    const requestParams = {
      watch_region: 'GB',
      include_adult: false,
      sort_by: 'popularity.desc',
      ...params,
    };

    // Check cache first
    if (USE_CACHE) {
      const cacheKey = createTMDbCacheKey('discover_movie', requestParams);
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
        };
      }
    }

    const response = await tmdbClient.get('/discover/movie', {
      params: requestParams,
    });

    // Cache the response
    if (USE_CACHE) {
      const cacheKey = createTMDbCacheKey('discover_movie', requestParams);
      await setCachedData(cacheKey, response.data);
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('TMDb Discover Movies Error:', error.message);
    return {
      success: false,
      error: error.message,
      data: { results: [] },
    };
  }
};

// Discover TV shows
export const discoverTV = async (params = {}) => {
  try {
    const requestParams = {
      watch_region: 'GB',
      include_adult: false,
      sort_by: 'popularity.desc',
      ...params,
    };

    // Check cache first
    if (USE_CACHE) {
      const cacheKey = createTMDbCacheKey('discover_tv', requestParams);
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
        };
      }
    }

    const response = await tmdbClient.get('/discover/tv', {
      params: requestParams,
    });

    // Cache the response
    if (USE_CACHE) {
      const cacheKey = createTMDbCacheKey('discover_tv', requestParams);
      await setCachedData(cacheKey, response.data);
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('TMDb Discover TV Error:', error.message);
    return {
      success: false,
      error: error.message,
      data: { results: [] },
    };
  }
};

// Get movie details
export const getMovieDetails = async (movieId) => {
  try {
    if (!movieId) {
      throw new Error('Movie ID is required');
    }

    // Check cache first
    if (USE_CACHE) {
      const cacheKey = createTMDbCacheKey(`movie_${movieId}`, {});
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
        };
      }
    }

    const response = await tmdbClient.get(`/movie/${movieId}`, {
      params: {
        append_to_response: 'credits,watch/providers,external_ids',
      },
    });

    // Cache the response
    if (USE_CACHE) {
      const cacheKey = createTMDbCacheKey(`movie_${movieId}`, {});
      await setCachedData(cacheKey, response.data);
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('TMDb Movie Details Error:', error.message);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

// Get TV show details
export const getTVDetails = async (tvId) => {
  try {
    if (!tvId) {
      throw new Error('TV show ID is required');
    }

    // Check cache first
    if (USE_CACHE) {
      const cacheKey = createTMDbCacheKey(`tv_${tvId}`, {});
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
        };
      }
    }

    const response = await tmdbClient.get(`/tv/${tvId}`, {
      params: {
        append_to_response: 'credits,watch/providers,external_ids',
      },
    });

    // Cache the response
    if (USE_CACHE) {
      const cacheKey = createTMDbCacheKey(`tv_${tvId}`, {});
      await setCachedData(cacheKey, response.data);
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('TMDb TV Details Error:', error.message);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

// Search multi (movies + TV)
export const searchMulti = async (query, page = 1) => {
  try {
    if (!query || query.trim() === '') {
      throw new Error('Search query is required');
    }

    const requestParams = {
      query: query.trim(),
      page,
      include_adult: false,
    };

    // Check cache first
    if (USE_CACHE) {
      const cacheKey = createTMDbCacheKey('search_multi', requestParams);
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
        };
      }
    }

    const response = await tmdbClient.get('/search/multi', {
      params: requestParams,
    });

    // Cache the response
    if (USE_CACHE) {
      const cacheKey = createTMDbCacheKey('search_multi', requestParams);
      await setCachedData(cacheKey, response.data);
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('TMDb Search Error:', error.message);
    return {
      success: false,
      error: error.message,
      data: { results: [] },
    };
  }
};

// Get watch providers list for a region
export const getWatchProviders = async (region = 'GB', mediaType = 'movie') => {
  try {
    const response = await tmdbClient.get(`/watch/providers/${mediaType}`, {
      params: {
        watch_region: region,
      },
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('TMDb Watch Providers Error:', error.message);
    return {
      success: false,
      error: error.message,
      data: { results: [] },
    };
  }
};

// Build image URL helper
export const buildImageUrl = (path, size = 'w500') => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

// Helper to build poster URL
export const buildPosterUrl = (path, size = 'w342') => {
  return buildImageUrl(path, size);
};

// Helper to build backdrop URL
export const buildBackdropUrl = (path, size = 'w1280') => {
  return buildImageUrl(path, size);
};

// Helper to build logo URL
export const buildLogoUrl = (path, size = 'w92') => {
  return buildImageUrl(path, size);
};

// Export all functions
export default {
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
};
