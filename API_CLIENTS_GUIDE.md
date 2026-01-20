# API Clients Guide

## Overview

The app uses two API clients with enhanced error handling, request logging, and consistent response formats.

## Response Format

All API functions return a consistent response format:

```javascript
{
  success: boolean,      // true if request succeeded
  data: object | array,  // Response data (or empty array/null on error)
  error?: string        // Error message (only present if success is false)
}
```

## TMDb API Client

Located in `src/api/tmdb.js`

### Features
- ✅ Automatic request/response logging (in development mode)
- ✅ Enhanced error handling with descriptive messages
- ✅ 10-second request timeout
- ✅ Consistent response format
- ✅ Input validation

### Functions

#### getConfiguration()
Fetch TMDb configuration (image base URLs and sizes). Call once at app start.

```javascript
import { getConfiguration } from './src/api/tmdb';

const result = await getConfiguration();

if (result.success) {
  const { images } = result.data;
  // images.base_url, images.poster_sizes, etc.
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    images: {
      base_url: "https://image.tmdb.org/t/p/",
      poster_sizes: ["w92", "w154", "w185", "w342", "w500", "w780", "original"],
      backdrop_sizes: ["w300", "w780", "w1280", "original"]
    }
  }
}
```

---

#### discoverMovies(params)
Discover movies with filters.

**Parameters:**
```javascript
{
  with_watch_providers: '8|350',  // Platform IDs (Netflix|Apple TV+)
  with_genres: '28,12',           // Genre IDs (Action, Adventure)
  sort_by: 'popularity.desc',     // Sort order (default)
  page: 1                          // Page number
}
```

**Example:**
```javascript
import { discoverMovies } from './src/api/tmdb';

const result = await discoverMovies({
  with_watch_providers: '8|350',
  with_genres: '28',
  page: 1
});

if (result.success) {
  const movies = result.data.results;
  // Process movies
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    page: 1,
    results: [
      {
        id: 550,
        title: "Fight Club",
        poster_path: "/path.jpg",
        backdrop_path: "/path.jpg",
        overview: "Description...",
        popularity: 45.123,
        vote_average: 8.4
      }
    ],
    total_pages: 100,
    total_results: 2000
  }
}
```

---

#### discoverTV(params)
Discover TV shows. Same parameters as discoverMovies.

**Example:**
```javascript
import { discoverTV } from './src/api/tmdb';

const result = await discoverTV({
  with_watch_providers: '8',
  page: 1
});
```

---

#### getMovieDetails(movieId)
Get detailed movie information including cast, providers, and IMDb ID.

**Example:**
```javascript
import { getMovieDetails } from './src/api/tmdb';

const result = await getMovieDetails(550); // Fight Club

if (result.success) {
  const movie = result.data;
  const imdbId = movie.external_ids.imdb_id; // For OMDB
  const ukProviders = movie['watch/providers']?.results?.GB?.flatrate;
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    id: 550,
    title: "Fight Club",
    overview: "Description...",
    poster_path: "/path.jpg",
    backdrop_path: "/path.jpg",
    release_date: "1999-10-15",
    runtime: 139,
    vote_average: 8.4,
    genres: [{ id: 18, name: "Drama" }],

    // Appended responses
    credits: {
      cast: [
        {
          name: "Brad Pitt",
          character: "Tyler Durden",
          profile_path: "/path.jpg"
        }
      ]
    },

    'watch/providers': {
      results: {
        GB: {
          flatrate: [
            {
              provider_id: 8,
              provider_name: "Netflix",
              logo_path: "/path.jpg"
            }
          ]
        }
      }
    },

    external_ids: {
      imdb_id: "tt0137523"  // Use this for OMDB
    }
  }
}
```

---

#### getTVDetails(tvId)
Get detailed TV show information. Similar structure to getMovieDetails.

**Example:**
```javascript
import { getTVDetails } from './src/api/tmdb';

const result = await getTVDetails(1396); // Breaking Bad

if (result.success) {
  const show = result.data;
  const imdbId = show.external_ids.imdb_id;
}
```

---

#### searchMulti(query, page)
Search for movies and TV shows.

**Example:**
```javascript
import { searchMulti } from './src/api/tmdb';

const result = await searchMulti('fallout', 1);

if (result.success) {
  const results = result.data.results.filter(
    item => item.media_type === 'movie' || item.media_type === 'tv'
  );
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    results: [
      {
        id: 12345,
        media_type: "tv",        // or "movie"
        name: "Fallout",         // name for TV, title for movies
        poster_path: "/path.jpg",
        first_air_date: "2024-04-10"  // or release_date for movies
      }
    ]
  }
}
```

---

#### getWatchProviders(region, mediaType)
Get list of available streaming providers.

**Parameters:**
- `region`: Region code (default: 'GB')
- `mediaType`: 'movie' or 'tv' (default: 'movie')

**Example:**
```javascript
import { getWatchProviders } from './src/api/tmdb';

const result = await getWatchProviders('GB', 'movie');

if (result.success) {
  const providers = result.data.results;
}
```

---

#### Image URL Helpers

```javascript
import {
  buildImageUrl,
  buildPosterUrl,
  buildBackdropUrl,
  buildLogoUrl
} from './src/api/tmdb';

// Generic
const url = buildImageUrl('/path.jpg', 'w500');

// Poster (default w342)
const posterUrl = buildPosterUrl('/poster.jpg');

// Backdrop (default w1280)
const backdropUrl = buildBackdropUrl('/backdrop.jpg');

// Logo (default w92)
const logoUrl = buildLogoUrl('/logo.jpg');
```

---

## OMDB API Client

Located in `src/api/omdb.js`

### Features
- ✅ Rotten Tomatoes + IMDb ratings extraction
- ✅ Metacritic score parsing
- ✅ Enhanced error handling
- ✅ Request logging (in development mode)
- ✅ Consistent response format

### Functions

#### getRatings(imdbId, type)
Get ratings for a title using its IMDb ID.

**Parameters:**
- `imdbId`: IMDb ID from TMDb (e.g., 'tt0137523')
- `type`: 'movie' or 'series' (default: 'movie')

**Example:**
```javascript
import { getMovieDetails } from './src/api/tmdb';
import { getRatings } from './src/api/omdb';

// First get movie details from TMDb
const tmdbResult = await getMovieDetails(550);

if (tmdbResult.success) {
  const imdbId = tmdbResult.data.external_ids.imdb_id;

  // Then get ratings from OMDB
  const omdbResult = await getRatings(imdbId, 'movie');

  if (omdbResult.success) {
    const { imdbRating, rottenTomatoes } = omdbResult.data;
    console.log(`IMDb: ${imdbRating}/10`);
    console.log(`RT: ${rottenTomatoes}%`);
  }
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    imdbRating: "8.4",           // IMDb score (string)
    rottenTomatoes: 92,          // RT percentage (number, no % sign)
    imdbVotes: "2,500,000",      // Vote count
    metacritic: "72",            // Metacritic score
    rawRatings: [                // Original ratings array
      { Source: "Internet Movie Database", Value: "8.4/10" },
      { Source: "Rotten Tomatoes", Value: "92%" },
      { Source: "Metacritic", Value: "72/100" }
    ]
  }
}
```

**Error Response:**
```javascript
{
  success: false,
  error: "Movie/show not found in OMDb database.",
  data: {
    imdbRating: null,
    rottenTomatoes: null,
    imdbVotes: null,
    metacritic: null,
    rawRatings: []
  }
}
```

---

#### Helper Functions

##### getRottenTomatoesScore(ratings)
Extract RT score from ratings array.

```javascript
import { getRottenTomatoesScore } from './src/api/omdb';

const ratings = [
  { Source: "Rotten Tomatoes", Value: "92%" }
];

const rtScore = getRottenTomatoesScore(ratings);
// Returns: 92 (number)
```

##### getIMDbScore(ratings)
Extract IMDb score from ratings array.

```javascript
const imdbScore = getIMDbScore(ratings);
// Returns: 8.4 (number)
```

##### getMetacriticScore(ratings)
Extract Metacritic score from ratings array.

```javascript
const metaScore = getMetacriticScore(ratings);
// Returns: 72 (number)
```

---

## Error Handling

Both API clients provide consistent error handling:

### TMDb Errors
- **401**: Invalid API key
- **404**: Resource not found
- **429**: Rate limit exceeded
- **Network errors**: Connection issues

### OMDB Errors
- **401**: Invalid API key
- **404**: Content not found in database
- **Network errors**: Connection issues

### Example Error Handling

```javascript
const result = await discoverMovies({ page: 1 });

if (!result.success) {
  // Handle error
  console.error('Error:', result.error);

  // UI can show error message or fallback content
  Alert.alert('Error', result.error);

  // Data will be empty but safe to use
  const movies = result.data.results; // []
}
```

---

## Request Logging

In development mode (`__DEV__`), all requests are logged:

```
[TMDb Request] GET /discover/movie { watch_region: 'GB', page: 1 }
[TMDb Response] /discover/movie Status: 200

[OMDb Request] GET { imdbId: 'tt0137523', type: 'movie' }
[OMDb Response] Status: 200
```

---

## Usage Examples

### Complete Flow: Browse Movies with Ratings

```javascript
import { discoverMovies, getMovieDetails } from './src/api/tmdb';
import { getRatings } from './src/api/omdb';

// 1. Discover movies on Netflix
const discoverResult = await discoverMovies({
  with_watch_providers: '8',
  page: 1
});

if (discoverResult.success) {
  const movies = discoverResult.data.results;

  // 2. Get details for first movie
  const firstMovie = movies[0];
  const detailsResult = await getMovieDetails(firstMovie.id);

  if (detailsResult.success) {
    const movie = detailsResult.data;

    // 3. Get ratings from OMDB
    const imdbId = movie.external_ids.imdb_id;
    const ratingsResult = await getRatings(imdbId, 'movie');

    if (ratingsResult.success) {
      // Display movie with all data
      console.log({
        title: movie.title,
        overview: movie.overview,
        imdbRating: ratingsResult.data.imdbRating,
        rottenTomatoes: ratingsResult.data.rottenTomatoes,
        availableOn: movie['watch/providers'].results.GB.flatrate
      });
    }
  }
}
```

### Search with Error Handling

```javascript
import { searchMulti } from './src/api/tmdb';

const handleSearch = async (query) => {
  if (!query.trim()) {
    return;
  }

  const result = await searchMulti(query);

  if (result.success) {
    const results = result.data.results.filter(
      item => item.media_type === 'movie' || item.media_type === 'tv'
    );

    if (results.length === 0) {
      Alert.alert('No Results', 'No movies or TV shows found.');
    } else {
      // Display results
      setSearchResults(results);
    }
  } else {
    // Handle error
    Alert.alert('Error', result.error);
  }
};
```

---

## Best Practices

1. **Always check success flag:**
   ```javascript
   if (result.success) {
     // Use result.data
   } else {
     // Handle result.error
   }
   ```

2. **OMDB calls only on detail screens:**
   - Don't fetch ratings for every card in browse view
   - Only fetch when user opens detail view
   - Cache ratings for 7 days

3. **Use image URL helpers:**
   ```javascript
   // Good
   const posterUrl = buildPosterUrl(movie.poster_path);

   // Avoid
   const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
   ```

4. **Handle missing data:**
   ```javascript
   const rtScore = ratingsResult.data.rottenTomatoes;
   const displayScore = rtScore ? `${rtScore}%` : 'N/A';
   ```

5. **Validate before calling:**
   ```javascript
   // Check if movie has IMDb ID before calling OMDB
   const imdbId = movie.external_ids?.imdb_id;
   if (imdbId) {
     const ratings = await getRatings(imdbId);
   }
   ```

---

## Rate Limits

**TMDb:**
- Free tier: 40 requests per 10 seconds
- Use caching to reduce requests

**OMDB:**
- Free tier: 1000 requests per day
- Only call on detail screens
- Cache for 7 days

---

## Testing API Keys

Test both APIs are working:

```javascript
import { getConfiguration } from './src/api/tmdb';
import { getRatings } from './src/api/omdb';

// Test TMDb
const tmdbTest = await getConfiguration();
console.log('TMDb:', tmdbTest.success ? '✅' : '❌');

// Test OMDB (Fight Club)
const omdbTest = await getRatings('tt0137523', 'movie');
console.log('OMDB:', omdbTest.success ? '✅' : '❌');
```

---

## Import Summary

```javascript
// Import individual functions
import {
  discoverMovies,
  getMovieDetails,
  getRatings
} from './src/api';

// Or import from specific files
import { discoverMovies } from './src/api/tmdb';
import { getRatings } from './src/api/omdb';

// Or import default objects
import TMDbAPI from './src/api/tmdb';
import OMDbAPI from './src/api/omdb';

const result = await TMDbAPI.discoverMovies({ page: 1 });
```

---

Both API clients are production-ready with comprehensive error handling, logging, and consistent response formats!
