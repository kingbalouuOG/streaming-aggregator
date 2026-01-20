import AsyncStorage from '@react-native-async-storage/async-storage';
import md5 from 'crypto-js/md5';
import { handleCacheError, logError } from '../utils/errorHandler';

const DEBUG = __DEV__;

// Cache prefixes
const CACHE_PREFIXES = {
  TMDB: 'tmdb_',
  OMDB: 'omdb_',
};

// Default TTL values (in milliseconds)
const CACHE_TTL = {
  TMDB: 24 * 60 * 60 * 1000,  // 24 hours
  OMDB: 7 * 24 * 60 * 60 * 1000,  // 7 days
};

/**
 * Get cached data with optional custom TTL
 * @param {string} key - Cache key (without prefix)
 * @param {number} ttl - Time to live in milliseconds (optional)
 * @returns {Promise<any|null>} - Cached data or null if expired/missing
 */
export const getCachedData = async (key, ttl = null) => {
  try {
    const cached = await AsyncStorage.getItem(key);

    if (!cached) {
      if (DEBUG) console.log('[Cache] Miss:', key);
      return null;
    }

    const { data, timestamp } = JSON.parse(cached);

    // Determine TTL: use provided TTL, or infer from key prefix
    const effectiveTTL = ttl || inferTTLFromKey(key);

    // Check if cache is still valid
    const age = Date.now() - timestamp;
    if (age < effectiveTTL) {
      if (DEBUG) console.log('[Cache] Hit:', key, `(age: ${Math.round(age / 1000 / 60)}min)`);
      return data;
    }

    // Cache expired, remove it
    if (DEBUG) console.log('[Cache] Expired:', key);
    await AsyncStorage.removeItem(key);
    return null;
  } catch (error) {
    return handleCacheError(error, null);
  }
};

/**
 * Set cached data with timestamp
 * @param {string} key - Cache key (without prefix)
 * @param {any} data - Data to cache
 * @returns {Promise<void>}
 */
export const setCachedData = async (key, data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    if (DEBUG) console.log('[Cache] Set:', key);
  } catch (error) {
    // Handle quota exceeded error
    if (error.message?.includes('quota') || error.message?.includes('QUOTA_EXCEEDED')) {
      logError(error, 'Cache quota exceeded - clearing old cache');
      await clearExpired();

      // Try again after clearing expired entries
      try {
        await AsyncStorage.setItem(key, JSON.stringify(cacheData));
        if (DEBUG) console.log('[Cache] Set (retry after clear):', key);
      } catch (retryError) {
        handleCacheError(retryError, null);
      }
    } else {
      handleCacheError(error, null);
    }
  }
};

/**
 * Clear all cached data or specific cache type
 * @param {string|null} prefix - Optional prefix to clear specific cache type
 * @returns {Promise<void>}
 */
export const clearCache = async (prefix = null) => {
  try {
    const keys = await AsyncStorage.getAllKeys();

    if (prefix) {
      // Clear specific cache type
      const cacheKeys = keys.filter(key => key.startsWith(prefix));
      await AsyncStorage.multiRemove(cacheKeys);
      if (DEBUG) console.log('[Cache] Cleared:', prefix, `(${cacheKeys.length} keys)`);
    } else {
      // Clear all API cache
      const cacheKeys = keys.filter(key =>
        key.startsWith(CACHE_PREFIXES.TMDB) ||
        key.startsWith(CACHE_PREFIXES.OMDB)
      );
      await AsyncStorage.multiRemove(cacheKeys);
      if (DEBUG) console.log('[Cache] Cleared all:', `(${cacheKeys.length} keys)`);
    }
  } catch (error) {
    console.error('[Cache] Clear error:', error);
  }
};

/**
 * Remove expired cache entries
 * @returns {Promise<number>} - Number of expired entries removed
 */
export const clearExpired = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key =>
      key.startsWith(CACHE_PREFIXES.TMDB) ||
      key.startsWith(CACHE_PREFIXES.OMDB)
    );

    let expiredCount = 0;

    for (const key of cacheKeys) {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) continue;

      const { timestamp } = JSON.parse(cached);
      const ttl = inferTTLFromKey(key);
      const age = Date.now() - timestamp;

      if (age >= ttl) {
        await AsyncStorage.removeItem(key);
        expiredCount++;
      }
    }

    if (DEBUG) console.log('[Cache] Cleared expired:', `(${expiredCount} keys)`);
    return expiredCount;
  } catch (error) {
    console.error('[Cache] Clear expired error:', error);
    return 0;
  }
};

/**
 * Get cache statistics
 * @returns {Promise<object>} - Cache stats
 */
export const getCacheStats = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const tmdbKeys = keys.filter(key => key.startsWith(CACHE_PREFIXES.TMDB));
    const omdbKeys = keys.filter(key => key.startsWith(CACHE_PREFIXES.OMDB));

    // Calculate total size (approximate)
    let totalSize = 0;
    for (const key of [...tmdbKeys, ...omdbKeys]) {
      const cached = await AsyncStorage.getItem(key);
      if (cached) totalSize += cached.length;
    }

    return {
      tmdb: {
        count: tmdbKeys.length,
        ttl: CACHE_TTL.TMDB,
      },
      omdb: {
        count: omdbKeys.length,
        ttl: CACHE_TTL.OMDB,
      },
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
      totalKeys: tmdbKeys.length + omdbKeys.length,
    };
  } catch (error) {
    console.error('[Cache] Stats error:', error);
    return null;
  }
};

/**
 * Create a cache key for TMDb endpoints
 * @param {string} endpoint - API endpoint (e.g., 'discover_movie')
 * @param {object} params - Request parameters
 * @returns {string} - Cache key
 */
export const createTMDbCacheKey = (endpoint, params = {}) => {
  const paramsHash = hashParams(params);
  return `${CACHE_PREFIXES.TMDB}${endpoint}_${paramsHash}`;
};

/**
 * Create a cache key for OMDB
 * @param {string} imdbId - IMDb ID
 * @returns {string} - Cache key
 */
export const createOMDbCacheKey = (imdbId) => {
  return `${CACHE_PREFIXES.OMDB}${imdbId}`;
};

/**
 * Hash parameters to create consistent cache keys
 * @param {object} params - Parameters object
 * @returns {string} - MD5 hash of sorted params
 */
const hashParams = (params) => {
  // Sort keys for consistent hashing
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});

  return md5(JSON.stringify(sortedParams)).toString();
};

/**
 * Infer TTL from cache key prefix
 * @param {string} key - Cache key
 * @returns {number} - TTL in milliseconds
 */
const inferTTLFromKey = (key) => {
  if (key.startsWith(CACHE_PREFIXES.OMDB)) {
    return CACHE_TTL.OMDB;
  }
  return CACHE_TTL.TMDB;
};

// Export constants
export { CACHE_PREFIXES, CACHE_TTL };

// Default export
export default {
  getCachedData,
  setCachedData,
  clearCache,
  clearExpired,
  getCacheStats,
  createTMDbCacheKey,
  createOMDbCacheKey,
  CACHE_PREFIXES,
  CACHE_TTL,
};
