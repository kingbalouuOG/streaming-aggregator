/**
 * Performance Optimization Utilities
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearCache, getCacheStats } from '../api/cache';

// Constants
const MAX_CACHE_SIZE_MB = 50;
const MAX_CACHE_SIZE_BYTES = MAX_CACHE_SIZE_MB * 1024 * 1024;

/**
 * Check cache size and clear if exceeds limit
 */
export const manageCacheSize = async () => {
  try {
    const stats = await getCacheStats();

    if (!stats) return;

    // Parse size string to bytes
    const sizeInKB = parseFloat(stats.totalSize);
    const sizeInBytes = sizeInKB * 1024;

    if (sizeInBytes > MAX_CACHE_SIZE_BYTES) {
      console.log(
        `[Performance] Cache size ${stats.totalSize} exceeds ${MAX_CACHE_SIZE_MB}MB, clearing...`
      );
      await clearCache();
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Performance] Error managing cache size:', error);
    return false;
  }
};

/**
 * Debounce function for search and other rapid inputs
 */
export const debounce = (func, wait) => {
  let timeout;

  const debounced = (...args) => {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };

  debounced.cancel = () => {
    clearTimeout(timeout);
  };

  return debounced;
};

/**
 * Throttle function to limit function calls
 */
export const throttle = (func, limit) => {
  let inThrottle;

  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Create cancellable promise for API requests
 */
export const makeCancellable = (promise) => {
  let isCancelled = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    promise
      .then((val) => (isCancelled ? reject({ isCancelled }) : resolve(val)))
      .catch((error) => (isCancelled ? reject({ isCancelled }) : reject(error)));
  });

  return {
    promise: wrappedPromise,
    cancel() {
      isCancelled = true;
    },
  };
};

/**
 * Batch multiple API requests
 */
export const batchRequests = async (requests, batchSize = 3) => {
  const results = [];

  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((req) => req()));
    results.push(...batchResults);
  }

  return results;
};

/**
 * Memoize expensive function results
 */
export const memoize = (fn) => {
  const cache = new Map();

  return (...args) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);

    // Limit cache size
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  };
};

/**
 * Get item layout for FlatList optimization
 */
export const getItemLayout = (itemHeight) => (data, index) => ({
  length: itemHeight,
  offset: itemHeight * index,
  index,
});

/**
 * Calculate optimal initialNumToRender based on screen size
 */
export const calculateInitialNumToRender = (itemHeight, screenHeight) => {
  const visibleItems = Math.ceil(screenHeight / itemHeight);
  return visibleItems + 2; // Add buffer of 2 items
};

/**
 * Memory warning handler
 */
export const handleMemoryWarning = async () => {
  console.warn('[Performance] Memory warning received, clearing cache...');
  await clearCache();
};

/**
 * Image cache manager
 */
export const ImageCacheManager = {
  _cache: new Map(),
  _maxSize: 100, // Max number of cached images

  async preload(uris) {
    const promises = uris.map((uri) => {
      return new Promise((resolve) => {
        if (this._cache.has(uri)) {
          resolve(true);
          return;
        }

        Image.prefetch(uri)
          .then(() => {
            this._cache.set(uri, true);
            this._enforceLimit();
            resolve(true);
          })
          .catch(() => resolve(false));
      });
    });

    return Promise.all(promises);
  },

  _enforceLimit() {
    if (this._cache.size > this._maxSize) {
      const firstKey = this._cache.keys().next().value;
      this._cache.delete(firstKey);
    }
  },

  clear() {
    this._cache.clear();
  },

  getSize() {
    return this._cache.size;
  },
};

/**
 * Performance monitoring
 */
export const PerformanceMonitor = {
  _marks: new Map(),

  mark(name) {
    this._marks.set(name, Date.now());
  },

  measure(name, startMark) {
    const startTime = this._marks.get(startMark);
    if (!startTime) {
      console.warn(`[Performance] Mark "${startMark}" not found`);
      return;
    }

    const duration = Date.now() - startTime;
    console.log(`[Performance] ${name}: ${duration}ms`);

    this._marks.delete(startMark);
    return duration;
  },

  clear() {
    this._marks.clear();
  },
};

export default {
  manageCacheSize,
  debounce,
  throttle,
  makeCancellable,
  batchRequests,
  memoize,
  getItemLayout,
  calculateInitialNumToRender,
  handleMemoryWarning,
  ImageCacheManager,
  PerformanceMonitor,
};
