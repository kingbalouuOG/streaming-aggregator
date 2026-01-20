# Caching System Guide

## Overview

The app implements a comprehensive caching layer using AsyncStorage to minimize API calls and improve performance. All TMDb and OMDB API responses are automatically cached.

## Cache Configuration

### TTL (Time To Live)

- **TMDb**: 24 hours (86,400,000 ms)
- **OMDB**: 7 days (604,800,000 ms)

Ratings change infrequently, so OMDB responses are cached longer.

### Cache Key Format

- **TMDb**: `tmdb_{endpoint}_{params_hash}`
  - Example: `tmdb_discover_movie_a3f8b2c1d4e5`
  - Example: `tmdb_movie_550_d41d8cd98f00`

- **OMDB**: `omdb_{imdb_id}`
  - Example: `omdb_tt0137523`

### Automatic Caching

All API functions automatically check cache first and store responses:

```javascript
import { discoverMovies, getRatings } from './src/api';

// Automatically checks cache first
const movies = await discoverMovies({ page: 1 });

// First call: API request → cache → return
// Subsequent calls (within 24h): cache → return (instant)
```

## Cache Functions

### getCachedData(key, ttl)

Retrieve cached data with optional custom TTL.

```javascript
import { getCachedData } from './src/api/cache';

// Use default TTL (inferred from key prefix)
const data = await getCachedData('tmdb_discover_movie_xyz');

// Use custom TTL (1 hour)
const data = await getCachedData('tmdb_discover_movie_xyz', 60 * 60 * 1000);

// Returns null if:
// - Cache miss (not found)
// - Cache expired
// - Error reading cache
```

**Parameters:**
- `key` (string): Full cache key with prefix
- `ttl` (number, optional): Time to live in milliseconds

**Returns:** Cached data or null

---

### setCachedData(key, data)

Store data in cache with timestamp.

```javascript
import { setCachedData } from './src/api/cache';

await setCachedData('tmdb_movie_550_xyz', movieData);

// Stored format:
// {
//   data: movieData,
//   timestamp: 1706554800000
// }
```

**Parameters:**
- `key` (string): Cache key
- `data` (any): Data to cache (will be JSON serialized)

---

### clearCache(prefix)

Clear all cached data or specific cache type.

```javascript
import { clearCache, CACHE_PREFIXES } from './src/api/cache';

// Clear all API cache
await clearCache();

// Clear only TMDb cache
await clearCache(CACHE_PREFIXES.TMDB);

// Clear only OMDB cache
await clearCache(CACHE_PREFIXES.OMDB);
```

**Use cases:**
- User logs out
- User wants to refresh data
- Settings screen "Clear Cache" button

---

### clearExpired()

Remove only expired cache entries (cleanup task).

```javascript
import { clearExpired } from './src/api/cache';

const count = await clearExpired();
console.log(`Removed ${count} expired entries`);
```

**Returns:** Number of expired entries removed

**Recommended usage:**
- Run on app startup
- Run periodically in background
- Run when storage is low

---

### getCacheStats()

Get cache statistics for debugging/monitoring.

```javascript
import { getCacheStats } from './src/api/cache';

const stats = await getCacheStats();
console.log(stats);

// Output:
// {
//   tmdb: {
//     count: 45,
//     ttl: 86400000
//   },
//   omdb: {
//     count: 12,
//     ttl: 604800000
//   },
//   totalSize: "234.56 KB",
//   totalKeys: 57
// }
```

**Use cases:**
- Settings screen stats
- Debug performance issues
- Monitor storage usage

---

### createTMDbCacheKey(endpoint, params)

Generate consistent cache key for TMDb endpoints.

```javascript
import { createTMDbCacheKey } from './src/api/cache';

const key = createTMDbCacheKey('discover_movie', {
  page: 1,
  with_watch_providers: '8'
});
// Returns: "tmdb_discover_movie_a3f8b2c1d4e5"

// Same params in different order = same key
const key1 = createTMDbCacheKey('search', { query: 'fallout', page: 1 });
const key2 = createTMDbCacheKey('search', { page: 1, query: 'fallout' });
// key1 === key2 (true)
```

---

### createOMDbCacheKey(imdbId)

Generate cache key for OMDB ratings.

```javascript
import { createOMDbCacheKey } from './src/api/cache';

const key = createOMDbCacheKey('tt0137523');
// Returns: "omdb_tt0137523"
```

---

## Integration with API Clients

Both TMDb and OMDB clients have caching built-in. You don't need to manually cache responses.

### TMDb Caching

```javascript
import { discoverMovies } from './src/api/tmdb';

// First call
const result1 = await discoverMovies({ page: 1 });
// [TMDb Request] GET /discover/movie ...
// [Cache] Set: tmdb_discover_movie_xyz

// Second call (within 24 hours)
const result2 = await discoverMovies({ page: 1 });
// [Cache] Hit: tmdb_discover_movie_xyz (age: 5min)
// No API request made!
```

**Cached endpoints:**
- ✅ `getConfiguration()`
- ✅ `discoverMovies(params)`
- ✅ `discoverTV(params)`
- ✅ `getMovieDetails(id)`
- ✅ `getTVDetails(id)`
- ✅ `searchMulti(query, page)`

### OMDB Caching

```javascript
import { getRatings } from './src/api/omdb';

// First call
const result1 = await getRatings('tt0137523');
// [OMDb Request] GET { imdbId: 'tt0137523' }
// [Cache] Set: omdb_tt0137523

// Second call (within 7 days)
const result2 = await getRatings('tt0137523');
// [Cache] Hit: omdb_tt0137523 (age: 120min)
// No API request made!
```

**Cached endpoint:**
- ✅ `getRatings(imdbId, type)`

---

## Debug Logging

In development mode (`__DEV__`), cache operations are logged:

```
[Cache] Miss: tmdb_discover_movie_xyz
[TMDb Request] GET /discover/movie ...
[Cache] Set: tmdb_discover_movie_xyz

[Cache] Hit: tmdb_discover_movie_xyz (age: 5min)

[Cache] Expired: tmdb_discover_movie_abc
[Cache] Cleared: tmdb_ (45 keys)
```

---

## Usage Examples

### Example 1: Settings Screen with Cache Management

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { getCacheStats, clearCache, clearExpired } from './src/api';

const SettingsScreen = () => {
  const [stats, setStats] = useState(null);

  const loadStats = async () => {
    const cacheStats = await getCacheStats();
    setStats(cacheStats);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleClearCache = async () => {
    await clearCache();
    alert('Cache cleared!');
    loadStats();
  };

  const handleClearExpired = async () => {
    const count = await clearExpired();
    alert(`Removed ${count} expired entries`);
    loadStats();
  };

  return (
    <View>
      <Text>TMDb Cache: {stats?.tmdb.count} entries</Text>
      <Text>OMDB Cache: {stats?.omdb.count} entries</Text>
      <Text>Total Size: {stats?.totalSize}</Text>

      <Button title="Clear All Cache" onPress={handleClearCache} />
      <Button title="Clear Expired Only" onPress={handleClearExpired} />
    </View>
  );
};
```

---

### Example 2: App Initialization with Cache Cleanup

```javascript
import React, { useEffect } from 'react';
import { clearExpired } from './src/api';

const App = () => {
  useEffect(() => {
    // Clean up expired cache on app start
    const initCache = async () => {
      const count = await clearExpired();
      console.log(`Cleaned up ${count} expired cache entries`);
    };

    initCache();
  }, []);

  return (
    // ... app content
  );
};
```

---

### Example 3: Manual Cache Control

```javascript
import {
  getCachedData,
  setCachedData,
  createTMDbCacheKey,
  CACHE_TTL
} from './src/api';

// Check if specific data is cached
const checkCache = async () => {
  const key = createTMDbCacheKey('discover_movie', { page: 1 });
  const cached = await getCachedData(key);

  if (cached) {
    console.log('Data is cached:', cached);
  } else {
    console.log('Cache miss, need to fetch');
  }
};

// Manually cache custom data
const cacheCustomData = async () => {
  const key = createTMDbCacheKey('custom_data', {});
  await setCachedData(key, { custom: 'data' });
};

// Use custom TTL (shorter cache duration)
const getWithShortTTL = async () => {
  const key = createTMDbCacheKey('search', { query: 'test' });
  const cached = await getCachedData(key, 5 * 60 * 1000); // 5 minutes
  return cached;
};
```

---

### Example 4: Force Refresh (Bypass Cache)

```javascript
import { discoverMovies, clearCache, CACHE_PREFIXES } from './src/api';

const forceRefreshMovies = async () => {
  // Clear specific cache before fetching
  await clearCache(CACHE_PREFIXES.TMDB);

  // This will fetch fresh data
  const result = await discoverMovies({ page: 1 });

  return result;
};

// Or clear just one endpoint's cache
import { createTMDbCacheKey } from './src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const forceRefreshSpecific = async () => {
  // Remove specific cache entry
  const key = createTMDbCacheKey('discover_movie', { page: 1 });
  await AsyncStorage.removeItem(key);

  // Fetch fresh data
  const result = await discoverMovies({ page: 1 });
  return result;
};
```

---

## Performance Benefits

### Before Caching
```
User opens app
├─ Fetch config: 200ms
├─ Fetch movies page 1: 400ms
├─ Fetch movies page 2: 400ms
├─ User goes to detail: 300ms
└─ User goes back and forth: 300ms each time
Total: 1600ms+ for initial load, 300ms+ for each navigation
```

### After Caching
```
User opens app (first time)
├─ Fetch config: 200ms (cached for 24h)
├─ Fetch movies page 1: 400ms (cached for 24h)
├─ Fetch movies page 2: 400ms (cached for 24h)
├─ User goes to detail: 300ms (cached for 24h)
Total: 1300ms for first load

User opens app (next time within 24h)
├─ Get config: ~5ms (from cache)
├─ Get movies page 1: ~10ms (from cache)
├─ Get movies page 2: ~10ms (from cache)
├─ User goes to detail: ~5ms (from cache)
Total: ~30ms (53x faster!)
```

---

## Best Practices

### 1. Let Auto-Caching Work
Don't manually cache API responses - it's handled automatically:

```javascript
// ❌ Don't do this
const movies = await discoverMovies({ page: 1 });
await setCachedData('movies', movies); // Redundant

// ✅ Do this
const movies = await discoverMovies({ page: 1 }); // Automatically cached
```

### 2. Clean Up Expired Entries Periodically

```javascript
// On app start
useEffect(() => {
  clearExpired();
}, []);

// Or on a schedule
setInterval(() => {
  clearExpired();
}, 24 * 60 * 60 * 1000); // Once per day
```

### 3. Provide User Control

Give users a "Clear Cache" option in settings:

```javascript
<Button title="Clear Cache" onPress={() => clearCache()} />
```

### 4. Monitor Cache Size

Show cache stats in developer settings:

```javascript
const stats = await getCacheStats();
console.log(`Using ${stats.totalSize} of storage`);
```

### 5. Handle Cache Gracefully

Cache reads can fail - always handle nulls:

```javascript
const cached = await getCachedData(key);
if (cached) {
  // Use cached data
} else {
  // Fetch fresh data
}
```

---

## Troubleshooting

### Issue: Cache not working
**Solution:** Check if `USE_CACHE` is enabled in tmdb.js and omdb.js

### Issue: Stale data shown
**Solution:** Cache might not be expiring. Check TTL values or call `clearCache()`

### Issue: Storage full errors
**Solution:** Call `clearCache()` or `clearExpired()` to free space

### Issue: Cache keys not matching
**Solution:** Ensure params are in same format when creating keys (the system handles this automatically with MD5 hashing)

---

## API Rate Limit Protection

Caching significantly reduces API calls:

### TMDb Rate Limit
- **Limit:** 40 requests per 10 seconds
- **With caching:** Most requests served from cache
- **Example:** 100 users browsing popular movies = 1 API call (cached for all)

### OMDB Rate Limit
- **Limit:** 1000 requests per day (free tier)
- **With 7-day cache:** Ratings fetched once per week
- **Example:** 500 users viewing same movie = 1 API call (cached for all)

---

## Summary

✅ **Automatic caching** for all TMDb and OMDB responses
✅ **24-hour TTL** for TMDb (content updates daily)
✅ **7-day TTL** for OMDB (ratings change infrequently)
✅ **MD5 hashing** for consistent cache keys
✅ **Cache statistics** for monitoring
✅ **Expired entry cleanup** to manage storage
✅ **Debug logging** in development mode
✅ **User controls** for cache management

The caching system is production-ready and requires zero configuration! 🚀
