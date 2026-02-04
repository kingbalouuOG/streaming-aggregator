import axios from 'axios';
import { WATCHMODE_API_KEY } from '@env';
import { getCachedData, setCachedData } from './cache';
import { logError, ErrorType } from '../utils/errorHandler';
import { normalizePlatformName } from '../constants/platforms';

const BASE_URL = 'https://api.watchmode.com/v1';
const API_KEY = WATCHMODE_API_KEY;

const DEBUG = __DEV__;
const USE_CACHE = true;

// Cache prefix for WatchMode
const WATCHMODE_CACHE_PREFIX = 'watchmode_';
const WATCHMODE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Create axios instance
const watchmodeClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Request interceptor for logging
watchmodeClient.interceptors.request.use(
  (config) => {
    if (DEBUG) {
      console.log('[WatchMode Request]', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    if (DEBUG) {
      console.error('[WatchMode Request Error]', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor for logging
watchmodeClient.interceptors.response.use(
  (response) => {
    if (DEBUG) {
      console.log('[WatchMode Response]', response.config.url, 'Status:', response.status);
    }
    return response;
  },
  (error) => {
    if (DEBUG) {
      console.error('[WatchMode Response Error]', error.config?.url, error.response?.status, error.message);
    }
    return Promise.reject(handleWatchModeError(error));
  }
);

// Error handler
const handleWatchModeError = (error) => {
  let enhancedError;

  if (error.response) {
    const { status, data } = error.response;
    const message = data?.statusMessage || 'WatchMode API error';

    switch (status) {
      case 401:
        enhancedError = new Error('Invalid WatchMode API key.');
        enhancedError.code = ErrorType.AUTHENTICATION;
        break;
      case 404:
        enhancedError = new Error('Title not found in WatchMode.');
        enhancedError.code = ErrorType.API;
        break;
      case 429:
        enhancedError = new Error('WatchMode rate limit exceeded.');
        enhancedError.code = ErrorType.RATE_LIMIT;
        break;
      default:
        enhancedError = new Error(`WatchMode API Error: ${message}`);
        enhancedError.code = ErrorType.API;
    }
    enhancedError.status = status;
  } else if (error.request) {
    enhancedError = new Error('Network error connecting to WatchMode.');
    enhancedError.code = ErrorType.NETWORK;
  } else {
    enhancedError = new Error(error.message || 'An unexpected error occurred.');
    enhancedError.code = ErrorType.UNKNOWN;
  }

  logError(enhancedError, 'WatchMode API');
  return enhancedError;
};

// Create cache key for WatchMode
const createWatchModeCacheKey = (tmdbId, type) => {
  return `${WATCHMODE_CACHE_PREFIX}${type}_${tmdbId}`;
};

/**
 * Get WatchMode title ID from TMDB ID
 * @param {number} tmdbId - TMDB ID
 * @param {string} type - 'movie' or 'tv'
 * @returns {Promise<number|null>} - WatchMode title ID
 */
const getWatchModeTitleId = async (tmdbId, type) => {
  try {
    // WatchMode requires specific field names: tmdb_movie_id or tmdb_tv_id
    const searchField = type === 'tv' ? 'tmdb_tv_id' : 'tmdb_movie_id';
    const searchType = type === 'tv' ? 'tv' : 'movie';
    const response = await watchmodeClient.get('/search/', {
      params: {
        apiKey: API_KEY,
        search_field: searchField,
        search_value: tmdbId,
        types: searchType,
      },
    });

    if (response.data?.title_results?.length > 0) {
      return response.data.title_results[0].id;
    }
    return null;
  } catch (error) {
    if (DEBUG) {
      console.log('[WatchMode] Could not find title ID for TMDB:', tmdbId);
    }
    return null;
  }
};

/**
 * Get streaming sources/prices for a title
 * @param {number} tmdbId - TMDB ID
 * @param {string} type - 'movie' or 'tv'
 * @param {string} region - Region code (default: 'GB')
 * @returns {Promise<{success: boolean, data: object|null}>}
 */
export const getTitleSources = async (tmdbId, type = 'movie', region = 'GB') => {
  try {
    // Check cache first
    const cacheKey = createWatchModeCacheKey(tmdbId, type);
    if (USE_CACHE) {
      const cached = await getCachedData(cacheKey, WATCHMODE_CACHE_TTL);
      if (cached) {
        return { success: true, data: cached };
      }
    }

    // Get WatchMode title ID from TMDB ID
    const watchmodeId = await getWatchModeTitleId(tmdbId, type);

    if (!watchmodeId) {
      return { success: false, data: null, error: 'Title not found' };
    }

    // Get sources for the title
    const response = await watchmodeClient.get(`/title/${watchmodeId}/sources/`, {
      params: {
        apiKey: API_KEY,
        regions: region,
      },
    });

    if (response.data) {
      // Process and categorize sources
      const sources = response.data;
      const processed = processSourcesData(sources);

      // Cache the result
      if (USE_CACHE) {
        await setCachedData(cacheKey, processed);
      }

      return { success: true, data: processed };
    }

    return { success: false, data: null };
  } catch (error) {
    if (DEBUG) {
      console.error('[WatchMode] Error fetching sources:', error.message);
    }
    return { success: false, data: null, error: error.message };
  }
};

/**
 * Process WatchMode sources data into a cleaner format
 * Groups by platform and extracts rent/buy prices
 */
const processSourcesData = (sources) => {
  const rentOptions = [];
  const buyOptions = [];
  const subscriptionOptions = [];

  // WatchMode source types:
  // sub = subscription, rent = rental, buy = purchase, free = free with ads
  sources.forEach((source) => {
    const platformInfo = {
      name: normalizePlatformName(source.name),
      sourceId: source.source_id,
      type: source.type,
      format: source.format, // 'hd', 'sd', '4k'
      price: source.price ? parseFloat(source.price) : null,
      webUrl: source.web_url,
      iosUrl: source.ios_url,
      androidUrl: source.android_url,
    };

    switch (source.type) {
      case 'rent':
        rentOptions.push(platformInfo);
        break;
      case 'buy':
        buyOptions.push(platformInfo);
        break;
      case 'sub':
        subscriptionOptions.push(platformInfo);
        break;
      case 'free':
        subscriptionOptions.push({ ...platformInfo, isFree: true });
        break;
    }
  });

  // Group rent/buy by platform and get best (lowest) price
  const groupByPlatform = (options) => {
    const grouped = {};
    options.forEach((opt) => {
      const key = opt.name;
      if (!grouped[key] || (opt.price && opt.price < grouped[key].price)) {
        grouped[key] = opt;
      }
    });
    return Object.values(grouped);
  };

  return {
    rent: groupByPlatform(rentOptions),
    buy: groupByPlatform(buyOptions),
    subscription: subscriptionOptions,
    allSources: sources,
  };
};

/**
 * Get rental/purchase prices for a title (simplified interface)
 * @param {number} tmdbId - TMDB ID
 * @param {string} type - 'movie' or 'tv'
 * @returns {Promise<{rent: Array, buy: Array}|null>}
 */
export const getTitlePrices = async (tmdbId, type = 'movie') => {
  const result = await getTitleSources(tmdbId, type);

  if (!result.success || !result.data) {
    return null;
  }

  return {
    rent: result.data.rent,
    buy: result.data.buy,
  };
};

/**
 * Format price for display
 * @param {number} price - Price value
 * @param {string} currency - Currency symbol (default: '£')
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price, currency = '£') => {
  if (price === null || price === undefined) {
    return null;
  }
  return `${currency}${price.toFixed(2)}`;
};

// Default export
export default {
  getTitleSources,
  getTitlePrices,
  formatPrice,
};
