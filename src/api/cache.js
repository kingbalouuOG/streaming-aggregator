import AsyncStorage from '@react-native-async-storage/async-storage';
import md5 from 'crypto-js/md5';
import { handleCacheError, logError } from '../utils/errorHandler';

const DEBUG = __DEV__;

// Cache prefixes
const CACHE_PREFIXES = {
  TMDB: 'tmdb_',
  OMDB: 'omdb_',
  WATCHMODE: 'watchmode_',
};

// Default TTL values (in milliseconds)
const CACHE_TTL = {
  TMDB: 24 * 60 * 60 * 1000,  // 24 hours
  OMDB: 7 * 24 * 60 * 60 * 1000,  // 7 days
  WATCHMODE: 24 * 60 * 60 * 1000,  // 24 hours
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
 * Check if error is a storage full error
 * @param {Error} error - Error object
 * @returns {boolean}
 */
const isStorageFullError = (error) => {
  const message = error.message?.toLowerCase() || '';
  const code = error.code?.toString() || '';
  return (
    message.includes('quota') ||
    message.includes('quota_exceeded') ||
    message.includes('disk is full') ||
    message.includes('sqlite_full') ||
    code.includes('13') ||
    code === 'SQLITE_FULL'
  );
};

/**
 * Set cached data with timestamp
 * @param {string} key - Cache key (without prefix)
 * @param {any} data - Data to cache
 * @returns {Promise<void>}
 */
export const setCachedData = async (key, data) => {
  const cacheData = {
    data,
    timestamp: Date.now(),
  };

  try {
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    if (DEBUG) console.log('[Cache] Set:', key);
  } catch (error) {
    // Handle storage full errors
    if (isStorageFullError(error)) {
      console.warn('[Cache] Storage full - clearing cache aggressively');

      // First try clearing expired entries
      await clearExpired();

      // Try again
      try {
        await AsyncStorage.setItem(key, JSON.stringify(cacheData));
        if (DEBUG) console.log('[Cache] Set (retry after clearExpired):', key);
        return;
      } catch (retryError) {
        if (isStorageFullError(retryError)) {
          // Still full - clear all cache
          console.warn('[Cache] Still full - clearing all API cache');
          await clearCache();

          // Final retry
          try {
            await AsyncStorage.setItem(key, JSON.stringify(cacheData));
            if (DEBUG) console.log('[Cache] Set (retry after clearAll):', key);
            return;
          } catch (finalError) {
            console.error('[Cache] Failed to set even after clearing all cache:', finalError.message);
          }
        }
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
        key.startsWith(CACHE_PREFIXES.OMDB) ||
        key.startsWith(CACHE_PREFIXES.WATCHMODE)
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
      key.startsWith(CACHE_PREFIXES.OMDB) ||
      key.startsWith(CACHE_PREFIXES.WATCHMODE)
    );

    let expiredCount = 0;
    const keysToRemove = [];

    for (const key of cacheKeys) {
      try {
        const cached = await AsyncStorage.getItem(key);
        if (!cached) continue;

        const { timestamp } = JSON.parse(cached);
        const ttl = inferTTLFromKey(key);
        const age = Date.now() - timestamp;

        if (age >= ttl) {
          keysToRemove.push(key);
          expiredCount++;
        }
      } catch {
        // If we can't read the entry, mark it for removal
        keysToRemove.push(key);
        expiredCount++;
      }
    }

    // Batch remove for efficiency
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }

    if (DEBUG) console.log('[Cache] Cleared expired:', `(${expiredCount} keys)`);
    return expiredCount;
  } catch (error) {
    console.error('[Cache] Clear expired error:', error);
    return 0;
  }
};

/**
 * Clear oldest cache entries to free up space
 * Removes entries older than specified age, or oldest 50% if no age specified
 * @param {number|null} maxAgeMs - Maximum age in milliseconds (optional)
 * @returns {Promise<number>} - Number of entries removed
 */
export const clearOldest = async (maxAgeMs = null) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key =>
      key.startsWith(CACHE_PREFIXES.TMDB) ||
      key.startsWith(CACHE_PREFIXES.OMDB) ||
      key.startsWith(CACHE_PREFIXES.WATCHMODE)
    );

    // Collect entries with timestamps
    const entries = [];
    for (const key of cacheKeys) {
      try {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const { timestamp } = JSON.parse(cached);
          entries.push({ key, timestamp, size: cached.length });
        }
      } catch {
        // Mark corrupt entries for removal
        entries.push({ key, timestamp: 0, size: 0 });
      }
    }

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    let keysToRemove = [];

    if (maxAgeMs) {
      // Remove entries older than maxAgeMs
      const cutoff = Date.now() - maxAgeMs;
      keysToRemove = entries.filter(e => e.timestamp < cutoff).map(e => e.key);
    } else {
      // Remove oldest 50%
      const halfIndex = Math.ceil(entries.length / 2);
      keysToRemove = entries.slice(0, halfIndex).map(e => e.key);
    }

    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }

    if (DEBUG) console.log('[Cache] Cleared oldest:', `(${keysToRemove.length} keys)`);
    return keysToRemove.length;
  } catch (error) {
    console.error('[Cache] Clear oldest error:', error);
    return 0;
  }
};

/**
 * Get cache statistics (includes all cache types)
 * @returns {Promise<object>} - Cache stats
 */
export const getCacheStats = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const tmdbKeys = keys.filter(key => key.startsWith(CACHE_PREFIXES.TMDB));
    const omdbKeys = keys.filter(key => key.startsWith(CACHE_PREFIXES.OMDB));
    const watchmodeKeys = keys.filter(key => key.startsWith(CACHE_PREFIXES.WATCHMODE));

    // Calculate total size (approximate)
    let totalSize = 0;
    const allCacheKeys = [...tmdbKeys, ...omdbKeys, ...watchmodeKeys];
    for (const key of allCacheKeys) {
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
      watchmode: {
        count: watchmodeKeys.length,
        ttl: CACHE_TTL.WATCHMODE,
      },
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
      totalKeys: allCacheKeys.length,
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
  if (key.startsWith(CACHE_PREFIXES.WATCHMODE)) {
    return CACHE_TTL.WATCHMODE;
  }
  return CACHE_TTL.TMDB;
};

/**
 * Clear a percentage of oldest cache entries (for memory pressure handling)
 * @param {number} percentage - Percentage of entries to remove (1-100)
 * @returns {Promise<number>} - Number of entries removed
 */
export const clearOldestPercentage = async (percentage) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key =>
      key.startsWith(CACHE_PREFIXES.TMDB) ||
      key.startsWith(CACHE_PREFIXES.OMDB) ||
      key.startsWith(CACHE_PREFIXES.WATCHMODE)
    );

    // Collect entries with timestamps
    const entries = [];
    for (const key of cacheKeys) {
      try {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const { timestamp } = JSON.parse(cached);
          entries.push({ key, timestamp });
        }
      } catch {
        // Mark corrupt entries for removal with oldest timestamp
        entries.push({ key, timestamp: 0 });
      }
    }

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate how many to remove
    const numToRemove = Math.ceil(entries.length * (percentage / 100));
    const keysToRemove = entries.slice(0, numToRemove).map(e => e.key);

    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      if (DEBUG) console.log(`[Cache] Cleared ${keysToRemove.length} oldest entries (${percentage}%)`);
    }

    return keysToRemove.length;
  } catch (error) {
    console.error('[Cache] Clear percentage error:', error);
    return 0;
  }
};

/**
 * Proactive cache maintenance - call periodically to prevent storage issues
 * Clears expired entries and oldest entries if cache is too large
 * @param {number} maxEntries - Maximum number of cache entries (default: 1000)
 * @returns {Promise<void>}
 */
export const maintainCache = async (maxEntries = 1000) => {
  try {
    // First clear expired entries
    await clearExpired();

    // Check current cache size
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key =>
      key.startsWith(CACHE_PREFIXES.TMDB) ||
      key.startsWith(CACHE_PREFIXES.OMDB) ||
      key.startsWith(CACHE_PREFIXES.WATCHMODE)
    );

    // If too many entries, clear oldest 30% to make room
    if (cacheKeys.length > maxEntries) {
      if (DEBUG) console.log(`[Cache] Too many entries (${cacheKeys.length}), clearing oldest 30%`);
      await clearOldestPercentage(30);
    }
  } catch (error) {
    console.error('[Cache] Maintenance error:', error);
  }
};

// Export constants
export { CACHE_PREFIXES, CACHE_TTL };

// Default export
export default {
  getCachedData,
  setCachedData,
  clearCache,
  clearExpired,
  clearOldest,
  clearOldestPercentage,
  maintainCache,
  getCacheStats,
  createTMDbCacheKey,
  createOMDbCacheKey,
  CACHE_PREFIXES,
  CACHE_TTL,
};
