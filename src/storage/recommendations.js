/**
 * Recommendations Storage Module
 * Handles caching of recommendations and tracking dismissed items
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const DEBUG = __DEV__;

// Storage keys
const STORAGE_KEYS = {
  RECOMMENDATIONS: '@app_recommendations',
  DISMISSED: '@app_dismissed_recommendations',
};

// Cache TTL constants
const RECOMMENDATION_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
const DISMISSED_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

// Default structures
const DEFAULT_RECOMMENDATIONS = {
  recommendations: [],
  generatedAt: 0,
  expiresAt: 0,
  basedOn: {
    genreAffinities: {},
    likedItemIds: [],
  },
  schemaVersion: 1,
};

const DEFAULT_DISMISSED = {
  items: [],
  schemaVersion: 1,
};

/**
 * Get cached recommendations
 * @returns {Promise<Object>} Cached recommendations object
 */
export const getCachedRecommendations = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.RECOMMENDATIONS);

    if (!data) {
      if (DEBUG) console.log('[Recommendations] No cached recommendations found');
      return { ...DEFAULT_RECOMMENDATIONS };
    }

    const parsed = JSON.parse(data);
    if (DEBUG) {
      console.log(
        '[Recommendations] Retrieved:',
        parsed.recommendations?.length || 0,
        'items, generated:',
        new Date(parsed.generatedAt).toISOString()
      );
    }
    return parsed;
  } catch (error) {
    console.error('[Recommendations] Error getting cached recommendations:', error);
    return { ...DEFAULT_RECOMMENDATIONS };
  }
};

/**
 * Check if the recommendation cache is still valid
 * @param {Object} cache - Cached recommendations object (optional, will fetch if not provided)
 * @returns {Promise<boolean>} True if cache is valid
 */
export const isRecommendationCacheValid = async (cache = null) => {
  try {
    const cached = cache || (await getCachedRecommendations());

    if (!cached || !cached.recommendations || cached.recommendations.length === 0) {
      if (DEBUG) console.log('[Recommendations] Cache invalid: empty');
      return false;
    }

    const now = Date.now();
    const isValid = now < cached.expiresAt;

    if (DEBUG) {
      console.log(
        '[Recommendations] Cache valid:',
        isValid,
        isValid ? `expires in ${Math.round((cached.expiresAt - now) / 60000)}min` : 'expired'
      );
    }
    return isValid;
  } catch (error) {
    console.error('[Recommendations] Error checking cache validity:', error);
    return false;
  }
};

/**
 * Save recommendations to cache
 * @param {Array} recommendations - Array of recommendation items
 * @param {Object} basedOn - Data used to generate recommendations
 * @returns {Promise<void>}
 */
export const setCachedRecommendations = async (recommendations, basedOn = {}) => {
  try {
    const now = Date.now();
    const data = {
      recommendations,
      generatedAt: now,
      expiresAt: now + RECOMMENDATION_CACHE_TTL,
      basedOn: {
        genreAffinities: basedOn.genreAffinities || {},
        likedItemIds: basedOn.likedItemIds || [],
      },
      schemaVersion: 1,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS, JSON.stringify(data));

    if (DEBUG) {
      console.log(
        '[Recommendations] Cached:',
        recommendations.length,
        'items, expires:',
        new Date(data.expiresAt).toISOString()
      );
    }
  } catch (error) {
    console.error('[Recommendations] Error caching recommendations:', error);
    throw error;
  }
};

/**
 * Clear the recommendations cache
 * @returns {Promise<void>}
 */
export const clearRecommendationCache = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.RECOMMENDATIONS);
    if (DEBUG) console.log('[Recommendations] Cache cleared');
  } catch (error) {
    console.error('[Recommendations] Error clearing cache:', error);
    throw error;
  }
};

/**
 * Invalidate cache (force regeneration on next request)
 * @returns {Promise<void>}
 */
export const invalidateRecommendationCache = async () => {
  try {
    const cached = await getCachedRecommendations();
    if (cached.recommendations.length > 0) {
      cached.expiresAt = 0; // Set to expired
      await AsyncStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS, JSON.stringify(cached));
      if (DEBUG) console.log('[Recommendations] Cache invalidated');
    }
  } catch (error) {
    console.error('[Recommendations] Error invalidating cache:', error);
  }
};

// ==========================================
// Dismissed Recommendations
// ==========================================

/**
 * Get dismissed recommendations
 * @returns {Promise<Object>} Dismissed items object
 */
export const getDismissedRecommendations = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DISMISSED);

    if (!data) {
      if (DEBUG) console.log('[Recommendations] No dismissed items found');
      return { ...DEFAULT_DISMISSED };
    }

    const parsed = JSON.parse(data);
    if (DEBUG) {
      console.log('[Recommendations] Dismissed items:', parsed.items?.length || 0);
    }
    return parsed;
  } catch (error) {
    console.error('[Recommendations] Error getting dismissed items:', error);
    return { ...DEFAULT_DISMISSED };
  }
};

/**
 * Dismiss a recommendation (won't show again for 30 days)
 * @param {number} id - TMDb ID
 * @param {string} type - 'movie' or 'tv'
 * @returns {Promise<void>}
 */
export const dismissRecommendation = async (id, type) => {
  try {
    const dismissed = await getDismissedRecommendations();

    // Check if already dismissed
    const exists = dismissed.items.some(
      (item) => item.id === id && item.type === type
    );

    if (exists) {
      if (DEBUG) console.log('[Recommendations] Item already dismissed:', id, type);
      return;
    }

    dismissed.items.push({
      id,
      type,
      dismissedAt: Date.now(),
    });

    await AsyncStorage.setItem(STORAGE_KEYS.DISMISSED, JSON.stringify(dismissed));

    if (DEBUG) console.log('[Recommendations] Dismissed:', id, type);
  } catch (error) {
    console.error('[Recommendations] Error dismissing recommendation:', error);
    throw error;
  }
};

/**
 * Check if a recommendation is dismissed
 * @param {number} id - TMDb ID
 * @param {string} type - 'movie' or 'tv'
 * @returns {Promise<boolean>}
 */
export const isDismissed = async (id, type) => {
  try {
    const dismissed = await getDismissedRecommendations();
    const now = Date.now();

    return dismissed.items.some(
      (item) =>
        item.id === id &&
        item.type === type &&
        now - item.dismissedAt < DISMISSED_TTL
    );
  } catch (error) {
    console.error('[Recommendations] Error checking dismissed status:', error);
    return false;
  }
};

/**
 * Remove expired dismissed items (older than 30 days)
 * @returns {Promise<number>} Number of items removed
 */
export const cleanExpiredDismissals = async () => {
  try {
    const dismissed = await getDismissedRecommendations();
    const now = Date.now();
    const initialCount = dismissed.items.length;

    dismissed.items = dismissed.items.filter(
      (item) => now - item.dismissedAt < DISMISSED_TTL
    );

    const removedCount = initialCount - dismissed.items.length;

    if (removedCount > 0) {
      await AsyncStorage.setItem(STORAGE_KEYS.DISMISSED, JSON.stringify(dismissed));
      if (DEBUG) console.log('[Recommendations] Cleaned expired dismissals:', removedCount);
    }

    return removedCount;
  } catch (error) {
    console.error('[Recommendations] Error cleaning expired dismissals:', error);
    return 0;
  }
};

/**
 * Clear all dismissed recommendations
 * @returns {Promise<void>}
 */
export const clearDismissedRecommendations = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.DISMISSED);
    if (DEBUG) console.log('[Recommendations] Dismissed items cleared');
  } catch (error) {
    console.error('[Recommendations] Error clearing dismissed items:', error);
    throw error;
  }
};

/**
 * Get list of dismissed item IDs (for filtering)
 * @returns {Promise<Set>} Set of "type-id" strings for quick lookup
 */
export const getDismissedIds = async () => {
  try {
    const dismissed = await getDismissedRecommendations();
    const now = Date.now();

    const validDismissed = dismissed.items.filter(
      (item) => now - item.dismissedAt < DISMISSED_TTL
    );

    return new Set(validDismissed.map((item) => `${item.type}-${item.id}`));
  } catch (error) {
    console.error('[Recommendations] Error getting dismissed IDs:', error);
    return new Set();
  }
};

// Export storage keys for direct access if needed
export { STORAGE_KEYS, RECOMMENDATION_CACHE_TTL, DISMISSED_TTL };

// Default export with all functions
export default {
  getCachedRecommendations,
  isRecommendationCacheValid,
  setCachedRecommendations,
  clearRecommendationCache,
  invalidateRecommendationCache,
  getDismissedRecommendations,
  dismissRecommendation,
  isDismissed,
  cleanExpiredDismissals,
  clearDismissedRecommendations,
  getDismissedIds,
  STORAGE_KEYS,
  RECOMMENDATION_CACHE_TTL,
  DISMISSED_TTL,
};
