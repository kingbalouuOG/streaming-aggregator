/**
 * Watchlist Storage Module
 * Handles all watchlist CRUD operations using AsyncStorage
 * Designed with sync-ready schema for future backend migration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const DEBUG = __DEV__;

// Storage keys
const STORAGE_KEYS = {
  WATCHLIST: '@app_watchlist',
};

// Default watchlist structure
const DEFAULT_WATCHLIST = {
  items: [],
  lastModified: Date.now(),
  schemaVersion: 1,
};

/**
 * Get the full watchlist
 * @returns {Promise<Object>} Watchlist object with items array
 */
export const getWatchlist = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WATCHLIST);

    if (!data) {
      if (DEBUG) console.log('[Watchlist] No watchlist found, returning default');
      return { ...DEFAULT_WATCHLIST };
    }

    const parsed = JSON.parse(data);
    if (DEBUG) console.log('[Watchlist] Retrieved:', parsed.items?.length || 0, 'items');
    return parsed;
  } catch (error) {
    console.error('[Watchlist] Error getting watchlist:', error);
    return { ...DEFAULT_WATCHLIST };
  }
};

/**
 * Save the full watchlist
 * @param {Object} watchlist - Watchlist object to save
 * @returns {Promise<void>}
 */
const saveWatchlist = async (watchlist) => {
  try {
    const data = {
      ...watchlist,
      lastModified: Date.now(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(data));
    if (DEBUG) console.log('[Watchlist] Saved:', data.items?.length || 0, 'items');
  } catch (error) {
    console.error('[Watchlist] Error saving watchlist:', error);
    throw error;
  }
};

/**
 * Get a single watchlist item
 * @param {number} id - TMDb ID
 * @param {string} type - 'movie' or 'tv'
 * @returns {Promise<Object|null>} Watchlist item or null if not found
 */
export const getWatchlistItem = async (id, type) => {
  try {
    const watchlist = await getWatchlist();
    const item = watchlist.items.find(
      (item) => item.id === id && item.type === type
    );

    if (DEBUG) {
      console.log('[Watchlist] Get item:', id, type, item ? 'found' : 'not found');
    }
    return item || null;
  } catch (error) {
    console.error('[Watchlist] Error getting item:', error);
    return null;
  }
};

/**
 * Check if an item is in the watchlist
 * @param {number} id - TMDb ID
 * @param {string} type - 'movie' or 'tv'
 * @returns {Promise<boolean>}
 */
export const isInWatchlist = async (id, type) => {
  const item = await getWatchlistItem(id, type);
  return item !== null;
};

/**
 * Add an item to the watchlist
 * @param {number} id - TMDb ID
 * @param {string} type - 'movie' or 'tv'
 * @param {Object} metadata - Content metadata for offline rendering
 * @param {string} status - Initial status ('want_to_watch' or 'watched')
 * @returns {Promise<Object>} The created watchlist item
 */
export const addToWatchlist = async (id, type, metadata, status = 'want_to_watch') => {
  try {
    // Validate inputs
    if (!id || !type) {
      throw new Error('id and type are required');
    }
    if (!['movie', 'tv'].includes(type)) {
      throw new Error('type must be "movie" or "tv"');
    }

    const watchlist = await getWatchlist();

    // Check for duplicates
    const existingIndex = watchlist.items.findIndex(
      (item) => item.id === id && item.type === type
    );

    if (existingIndex >= 0) {
      if (DEBUG) console.log('[Watchlist] Item already exists, updating instead');
      return await updateWatchlistItem(id, type, { status, metadata });
    }

    const now = Date.now();
    const newItem = {
      id,
      type,
      status,
      rating: 0, // neutral by default
      addedAt: now,
      updatedAt: now,
      watchedAt: status === 'watched' ? now : null,
      metadata: {
        title: metadata?.title || metadata?.name || 'Unknown Title',
        posterPath: metadata?.posterPath || metadata?.poster_path || null,
        backdropPath: metadata?.backdropPath || metadata?.backdrop_path || null,
        overview: metadata?.overview || '',
        releaseDate: metadata?.releaseDate || metadata?.release_date || metadata?.first_air_date || '',
        voteAverage: metadata?.voteAverage || metadata?.vote_average || 0,
        genreIds: metadata?.genreIds || metadata?.genre_ids || [],
        runtime: metadata?.runtime || null,
        numberOfSeasons: metadata?.numberOfSeasons || metadata?.number_of_seasons || null,
      },
      // Sync-ready fields
      syncStatus: 'local_only',
      lastSyncedAt: null,
      version: 1,
    };

    watchlist.items.unshift(newItem); // Add to beginning
    await saveWatchlist(watchlist);

    if (DEBUG) console.log('[Watchlist] Added:', newItem.metadata.title);
    return newItem;
  } catch (error) {
    console.error('[Watchlist] Error adding item:', error);
    throw error;
  }
};

/**
 * Update a watchlist item
 * @param {number} id - TMDb ID
 * @param {string} type - 'movie' or 'tv'
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated item or null if not found
 */
export const updateWatchlistItem = async (id, type, updates) => {
  try {
    const watchlist = await getWatchlist();
    const index = watchlist.items.findIndex(
      (item) => item.id === id && item.type === type
    );

    if (index < 0) {
      if (DEBUG) console.log('[Watchlist] Item not found for update:', id, type);
      return null;
    }

    const now = Date.now();
    const existingItem = watchlist.items[index];

    // Handle status change to 'watched'
    let watchedAt = existingItem.watchedAt;
    if (updates.status === 'watched' && existingItem.status !== 'watched') {
      watchedAt = now;
    } else if (updates.status === 'want_to_watch') {
      watchedAt = null;
    }

    const updatedItem = {
      ...existingItem,
      ...updates,
      watchedAt,
      updatedAt: now,
      syncStatus: 'pending_sync',
      version: existingItem.version + 1,
      // Preserve metadata if not explicitly updated
      metadata: updates.metadata
        ? { ...existingItem.metadata, ...updates.metadata }
        : existingItem.metadata,
    };

    watchlist.items[index] = updatedItem;
    await saveWatchlist(watchlist);

    if (DEBUG) console.log('[Watchlist] Updated:', updatedItem.metadata.title);
    return updatedItem;
  } catch (error) {
    console.error('[Watchlist] Error updating item:', error);
    throw error;
  }
};

/**
 * Remove an item from the watchlist
 * @param {number} id - TMDb ID
 * @param {string} type - 'movie' or 'tv'
 * @returns {Promise<boolean>} True if removed, false if not found
 */
export const removeFromWatchlist = async (id, type) => {
  try {
    const watchlist = await getWatchlist();
    const initialLength = watchlist.items.length;

    watchlist.items = watchlist.items.filter(
      (item) => !(item.id === id && item.type === type)
    );

    if (watchlist.items.length === initialLength) {
      if (DEBUG) console.log('[Watchlist] Item not found for removal:', id, type);
      return false;
    }

    await saveWatchlist(watchlist);
    if (DEBUG) console.log('[Watchlist] Removed item:', id, type);
    return true;
  } catch (error) {
    console.error('[Watchlist] Error removing item:', error);
    throw error;
  }
};

/**
 * Set watchlist item status
 * @param {number} id - TMDb ID
 * @param {string} type - 'movie' or 'tv'
 * @param {string} status - 'want_to_watch' or 'watched'
 * @returns {Promise<Object|null>} Updated item or null
 */
export const setWatchlistStatus = async (id, type, status) => {
  if (!['want_to_watch', 'watched'].includes(status)) {
    throw new Error('status must be "want_to_watch" or "watched"');
  }
  return await updateWatchlistItem(id, type, { status });
};

/**
 * Set watchlist item rating
 * @param {number} id - TMDb ID
 * @param {string} type - 'movie' or 'tv'
 * @param {number} rating - -1 (thumbs down), 0 (neutral), or 1 (thumbs up)
 * @returns {Promise<Object|null>} Updated item or null
 */
export const setWatchlistRating = async (id, type, rating) => {
  if (![-1, 0, 1].includes(rating)) {
    throw new Error('rating must be -1, 0, or 1');
  }
  return await updateWatchlistItem(id, type, { rating });
};

/**
 * Get watchlist items filtered by status
 * @param {string} status - 'want_to_watch' or 'watched'
 * @returns {Promise<Array>} Filtered items
 */
export const getWatchlistByStatus = async (status) => {
  try {
    const watchlist = await getWatchlist();
    const filtered = watchlist.items.filter((item) => item.status === status);

    if (DEBUG) {
      console.log('[Watchlist] Get by status:', status, filtered.length, 'items');
    }
    return filtered;
  } catch (error) {
    console.error('[Watchlist] Error getting by status:', error);
    return [];
  }
};

/**
 * Get watched items with a specific rating
 * @param {number} rating - -1, 0, or 1
 * @returns {Promise<Array>} Filtered items
 */
export const getWatchedWithRating = async (rating) => {
  try {
    const watchlist = await getWatchlist();
    const filtered = watchlist.items.filter(
      (item) => item.status === 'watched' && item.rating === rating
    );

    if (DEBUG) {
      console.log('[Watchlist] Get watched with rating:', rating, filtered.length, 'items');
    }
    return filtered;
  } catch (error) {
    console.error('[Watchlist] Error getting watched with rating:', error);
    return [];
  }
};

/**
 * Get watchlist statistics
 * @returns {Promise<Object>} Stats object
 */
export const getWatchlistStats = async () => {
  try {
    const watchlist = await getWatchlist();
    const items = watchlist.items;

    const stats = {
      total: items.length,
      wantToWatch: items.filter((i) => i.status === 'want_to_watch').length,
      watched: items.filter((i) => i.status === 'watched').length,
      liked: items.filter((i) => i.rating === 1).length,
      disliked: items.filter((i) => i.rating === -1).length,
      movies: items.filter((i) => i.type === 'movie').length,
      tvShows: items.filter((i) => i.type === 'tv').length,
    };

    if (DEBUG) console.log('[Watchlist] Stats:', stats);
    return stats;
  } catch (error) {
    console.error('[Watchlist] Error getting stats:', error);
    return {
      total: 0,
      wantToWatch: 0,
      watched: 0,
      liked: 0,
      disliked: 0,
      movies: 0,
      tvShows: 0,
    };
  }
};

/**
 * Get items that need syncing (for future backend integration)
 * @returns {Promise<Array>} Items with syncStatus !== 'synced'
 */
export const getItemsNeedingSync = async () => {
  try {
    const watchlist = await getWatchlist();
    return watchlist.items.filter((item) => item.syncStatus !== 'synced');
  } catch (error) {
    console.error('[Watchlist] Error getting items needing sync:', error);
    return [];
  }
};

/**
 * Mark an item as synced (for future backend integration)
 * @param {number} id - TMDb ID
 * @param {string} type - 'movie' or 'tv'
 * @returns {Promise<Object|null>} Updated item or null
 */
export const markAsSynced = async (id, type) => {
  try {
    const watchlist = await getWatchlist();
    const index = watchlist.items.findIndex(
      (item) => item.id === id && item.type === type
    );

    if (index < 0) return null;

    watchlist.items[index] = {
      ...watchlist.items[index],
      syncStatus: 'synced',
      lastSyncedAt: Date.now(),
    };

    await saveWatchlist(watchlist);
    return watchlist.items[index];
  } catch (error) {
    console.error('[Watchlist] Error marking as synced:', error);
    return null;
  }
};

/**
 * Clear the entire watchlist
 * @returns {Promise<void>}
 */
export const clearWatchlist = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.WATCHLIST);
    if (DEBUG) console.log('[Watchlist] Cleared');
  } catch (error) {
    console.error('[Watchlist] Error clearing watchlist:', error);
    throw error;
  }
};

/**
 * Export watchlist data for backup/sync
 * @returns {Promise<Object>} Full watchlist data
 */
export const exportWatchlist = async () => {
  return await getWatchlist();
};

/**
 * Import watchlist data from backup/sync
 * @param {Object} data - Watchlist data to import
 * @param {boolean} merge - If true, merge with existing. If false, replace.
 * @returns {Promise<void>}
 */
export const importWatchlist = async (data, merge = true) => {
  try {
    if (!data || !Array.isArray(data.items)) {
      throw new Error('Invalid watchlist data format');
    }

    if (merge) {
      const existing = await getWatchlist();
      const existingIds = new Set(
        existing.items.map((i) => `${i.type}-${i.id}`)
      );

      // Add items that don't already exist
      const newItems = data.items.filter(
        (item) => !existingIds.has(`${item.type}-${item.id}`)
      );

      existing.items = [...existing.items, ...newItems];
      await saveWatchlist(existing);

      if (DEBUG) console.log('[Watchlist] Imported (merged):', newItems.length, 'new items');
    } else {
      await saveWatchlist(data);
      if (DEBUG) console.log('[Watchlist] Imported (replaced):', data.items.length, 'items');
    }
  } catch (error) {
    console.error('[Watchlist] Error importing watchlist:', error);
    throw error;
  }
};

// Export storage keys for direct access if needed
export { STORAGE_KEYS };

// Default export with all functions
export default {
  getWatchlist,
  getWatchlistItem,
  isInWatchlist,
  addToWatchlist,
  updateWatchlistItem,
  removeFromWatchlist,
  setWatchlistStatus,
  setWatchlistRating,
  getWatchlistByStatus,
  getWatchedWithRating,
  getWatchlistStats,
  getItemsNeedingSync,
  markAsSynced,
  clearWatchlist,
  exportWatchlist,
  importWatchlist,
  STORAGE_KEYS,
};
