import axios from 'axios';
import { OMDB_API_KEY } from '@env';
import { getCachedData, setCachedData, createOMDbCacheKey } from './cache';

const BASE_URL = 'http://www.omdbapi.com/';
const API_KEY = OMDB_API_KEY;
const DEBUG = __DEV__; // Enable logging in development mode
const USE_CACHE = true; // Enable/disable caching

// Create axios instance with config
const omdbClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 second timeout
});

// Enhanced error handler
const handleOMDbError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    const message = data?.Error || 'OMDb API error';

    switch (status) {
      case 401:
        return new Error('Invalid OMDb API key. Please check your configuration.');
      case 404:
        return new Error('Movie/show not found in OMDb database.');
      default:
        return new Error(`OMDb API Error: ${message}`);
    }
  } else if (error.request) {
    return new Error('Network error. Please check your internet connection.');
  } else {
    return new Error(error.message || 'An unexpected error occurred.');
  }
};

// Get ratings for a title by IMDb ID
export const getRatings = async (imdbId, type = 'movie') => {
  try {
    if (!imdbId) {
      throw new Error('IMDb ID is required');
    }

    // Check cache first (7-day TTL for ratings)
    if (USE_CACHE) {
      const cacheKey = createOMDbCacheKey(imdbId);
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
        };
      }
    }

    if (DEBUG) {
      console.log('[OMDb Request] GET', { imdbId, type });
    }

    const response = await omdbClient.get('/', {
      params: {
        i: imdbId,
        apikey: API_KEY,
        type,
      },
    });

    if (DEBUG) {
      console.log('[OMDb Response] Status:', response.status);
    }

    // Check if API returned an error
    if (response.data.Response === 'False') {
      throw new Error(response.data.Error || 'Not found');
    }

    // Extract ratings data
    const ratings = response.data.Ratings || [];
    const rtScore = getRottenTomatoesScore(ratings);
    const imdbScore = response.data.imdbRating || null;

    const ratingsData = {
      imdbRating: imdbScore !== 'N/A' ? imdbScore : null,
      rottenTomatoes: rtScore,
      imdbVotes: response.data.imdbVotes || null,
      metacritic: response.data.Metascore !== 'N/A' ? response.data.Metascore : null,
      rawRatings: ratings,
    };

    // Cache the response (7-day TTL)
    if (USE_CACHE) {
      const cacheKey = createOMDbCacheKey(imdbId);
      await setCachedData(cacheKey, ratingsData);
    }

    return {
      success: true,
      data: ratingsData,
    };
  } catch (error) {
    const enhancedError = handleOMDbError(error);
    console.error('[OMDb Error]', enhancedError.message);

    return {
      success: false,
      error: enhancedError.message,
      data: {
        imdbRating: null,
        rottenTomatoes: null,
        imdbVotes: null,
        metacritic: null,
        rawRatings: [],
      },
    };
  }
};

// Parse Rotten Tomatoes score from ratings array
export const getRottenTomatoesScore = (ratings) => {
  if (!ratings || !Array.isArray(ratings)) return null;

  const rtRating = ratings.find(r => r.Source === 'Rotten Tomatoes');
  if (!rtRating || !rtRating.Value) return null;

  // Return just the percentage number (remove the % sign)
  const percentageMatch = rtRating.Value.match(/(\d+)%/);
  return percentageMatch ? parseInt(percentageMatch[1], 10) : null;
};

// Parse IMDb score from ratings array
export const getIMDbScore = (ratings) => {
  if (!ratings || !Array.isArray(ratings)) return null;

  const imdbRating = ratings.find(r => r.Source === 'Internet Movie Database');
  if (!imdbRating || !imdbRating.Value) return null;

  // Return just the numeric rating
  const ratingMatch = imdbRating.Value.match(/(\d+\.?\d*)/);
  return ratingMatch ? parseFloat(ratingMatch[1]) : null;
};

// Parse Metacritic score from ratings array
export const getMetacriticScore = (ratings) => {
  if (!ratings || !Array.isArray(ratings)) return null;

  const metacriticRating = ratings.find(r => r.Source === 'Metacritic');
  if (!metacriticRating || !metacriticRating.Value) return null;

  // Return just the numeric score
  const scoreMatch = metacriticRating.Value.match(/(\d+)/);
  return scoreMatch ? parseInt(scoreMatch[1], 10) : null;
};

// Export all functions
export default {
  getRatings,
  getRottenTomatoesScore,
  getIMDbScore,
  getMetacriticScore,
};
