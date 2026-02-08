/**
 * Service Cache Utility
 *
 * Caches streaming service providers for content items
 * Reduces API calls from ~200+ to much fewer with cache hits
 */

import { getContentWatchProviders } from '../api/tmdb';
import { mapProviderIdToCanonical } from '../constants/platforms';
import { ServiceType } from '../types';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface CacheEntry {
  services: ServiceType[];
  timestamp: number;
}

// ─────────────────────────────────────────────────────────────
// Cache Configuration
// ─────────────────────────────────────────────────────────────

const CACHE_TTL = 1000 * 60 * 30; // 30 minutes
const MAX_CACHE_SIZE = 500;

// In-memory cache
const serviceCache = new Map<string, CacheEntry>();

// Pending requests to prevent duplicate API calls
const pendingRequests = new Map<string, Promise<ServiceType[]>>();

// Valid service types
const VALID_SERVICES = new Set([
  'netflix', 'prime', 'disney', 'hbo', 'hulu', 'apple', 'paramount', 'crunchyroll'
]);

// ─────────────────────────────────────────────────────────────
// Cache Functions
// ─────────────────────────────────────────────────────────────

/**
 * Get cache key for a content item
 */
const getCacheKey = (itemId: string, mediaType: string): string => {
  return `${mediaType}-${itemId}`;
};

/**
 * Check if cache entry is still valid
 */
const isEntryValid = (entry: CacheEntry): boolean => {
  return Date.now() - entry.timestamp < CACHE_TTL;
};

/**
 * Clean up old cache entries if cache is too large
 */
const cleanupCache = (): void => {
  if (serviceCache.size <= MAX_CACHE_SIZE) return;

  // Remove oldest entries (first 20%)
  const entriesToRemove = Math.floor(serviceCache.size * 0.2);
  const keys = Array.from(serviceCache.keys()).slice(0, entriesToRemove);
  keys.forEach(key => serviceCache.delete(key));
};

/**
 * Get services for a content item with caching
 * Returns cached data if available, otherwise fetches from API
 */
export const getCachedServices = async (
  itemId: string,
  mediaType: string,
  maxServices: number = 4
): Promise<ServiceType[]> => {
  const cacheKey = getCacheKey(itemId, mediaType);

  // Check cache first
  const cached = serviceCache.get(cacheKey);
  if (cached && isEntryValid(cached)) {
    return cached.services.slice(0, maxServices);
  }

  // Check if request is already pending (prevent duplicate API calls)
  const pending = pendingRequests.get(cacheKey);
  if (pending) {
    const services = await pending;
    return services.slice(0, maxServices);
  }

  // Create new request
  const requestPromise = fetchServicesFromAPI(itemId, mediaType);
  pendingRequests.set(cacheKey, requestPromise);

  try {
    const services = await requestPromise;

    // Cache the result
    serviceCache.set(cacheKey, {
      services,
      timestamp: Date.now(),
    });

    // Cleanup if needed
    cleanupCache();

    return services.slice(0, maxServices);
  } finally {
    // Remove from pending requests
    pendingRequests.delete(cacheKey);
  }
};

/**
 * Fetch services from API
 */
const fetchServicesFromAPI = async (
  itemId: string,
  mediaType: string
): Promise<ServiceType[]> => {
  try {
    const response = await getContentWatchProviders(itemId, mediaType);

    if (response.success && response.data?.flatrate) {
      const services = response.data.flatrate
        .map((p: any) => mapProviderIdToCanonical(p.provider_id))
        .filter((id: string | null): id is ServiceType =>
          id !== null && VALID_SERVICES.has(id)
        );
      return services;
    }

    return [];
  } catch (error) {
    __DEV__ && console.warn('[ServiceCache] Error fetching services:', error);
    return [];
  }
};

/**
 * Prefetch services for multiple items at once
 * Useful for prefetching when a list loads
 */
export const prefetchServices = async (
  items: Array<{ id: string; type?: string }>
): Promise<void> => {
  const promises = items.map(item =>
    getCachedServices(item.id, item.type || 'movie').catch(() => [])
  );
  await Promise.allSettled(promises);
};

/**
 * Clear the service cache
 */
export const clearServiceCache = (): void => {
  serviceCache.clear();
  pendingRequests.clear();
};

/**
 * Get cache statistics (for debugging)
 */
export const getServiceCacheStats = (): { size: number; pending: number } => {
  return {
    size: serviceCache.size,
    pending: pendingRequests.size,
  };
};

export default {
  getCachedServices,
  prefetchServices,
  clearServiceCache,
  getServiceCacheStats,
};
