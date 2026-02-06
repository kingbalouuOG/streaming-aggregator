/**
 * Recommendation Engine
 * Generates personalized content recommendations based on user's watchlist
 *
 * Simplified Algorithm:
 * - 70% weight: Genre affinity (based on watchlist genres and ratings)
 * - 30% weight: TMDb similar content (for top liked items)
 */

import { getWatchlist, getWatchlistByStatus, getWatchedWithRating } from '../storage/watchlist';
import {
  getCachedRecommendations,
  setCachedRecommendations,
  isRecommendationCacheValid,
  getDismissedIds,
  cleanExpiredDismissals,
} from '../storage/recommendations';
import {
  discoverMovies,
  discoverTV,
  getSimilarMovies,
  getSimilarTV,
} from '../api/tmdb';
import { GENRE_NAMES } from '../constants/genres';

const DEBUG = __DEV__;

// Algorithm weights
const WEIGHTS = {
  GENRE_AFFINITY: 0.70,
  SIMILAR_CONTENT: 0.30,
};

// Scoring multipliers for watchlist items
const AFFINITY_SCORES = {
  WATCHED_LIKED: 3,      // Watched + thumbs up
  WATCHED_NEUTRAL: 1,    // Watched + neutral
  WATCHED_DISLIKED: -1,  // Watched + thumbs down
  WANT_TO_WATCH: 1,      // Want to watch (any)
};

/**
 * Calculate genre affinities from user's watchlist
 * @returns {Object} Map of genreId to affinity score
 */
export const calculateGenreAffinities = async () => {
  try {
    const watchlist = await getWatchlist();
    const affinities = {};

    watchlist.items.forEach((item) => {
      // Determine affinity multiplier based on status and rating
      let multiplier;
      if (item.status === 'watched') {
        if (item.rating === 1) {
          multiplier = AFFINITY_SCORES.WATCHED_LIKED;
        } else if (item.rating === -1) {
          multiplier = AFFINITY_SCORES.WATCHED_DISLIKED;
        } else {
          multiplier = AFFINITY_SCORES.WATCHED_NEUTRAL;
        }
      } else {
        multiplier = AFFINITY_SCORES.WANT_TO_WATCH;
      }

      // Apply score to each genre
      const genreIds = item.metadata?.genreIds || [];
      genreIds.forEach((genreId) => {
        affinities[genreId] = (affinities[genreId] || 0) + multiplier;
      });
    });

    if (DEBUG) {
      console.log('[RecommendationEngine] Genre affinities:', affinities);
    }

    return affinities;
  } catch (error) {
    console.error('[RecommendationEngine] Error calculating affinities:', error);
    return {};
  }
};

/**
 * Get top N genres by affinity score
 * @param {Object} affinities - Genre affinity map
 * @param {number} count - Number of top genres to return
 * @returns {Array} Array of { genreId, score }
 */
export const getTopGenres = (affinities, count = 3) => {
  const sorted = Object.entries(affinities)
    .map(([genreId, score]) => ({ genreId: parseInt(genreId), score }))
    .filter((g) => g.score > 0) // Only positive affinities
    .sort((a, b) => b.score - a.score)
    .slice(0, count);

  return sorted;
};

/**
 * Get top liked items from watchlist
 * @param {number} count - Number of items to return
 * @returns {Array} Top liked watchlist items
 */
export const getTopLikedItems = async (count = 3) => {
  try {
    const likedItems = await getWatchedWithRating(1);
    // Sort by addedAt (most recent first) and take top N
    return likedItems
      .sort((a, b) => b.addedAt - a.addedAt)
      .slice(0, count);
  } catch (error) {
    console.error('[RecommendationEngine] Error getting liked items:', error);
    return [];
  }
};

/**
 * Fetch genre-based content recommendations
 * @param {Array} topGenres - Array of { genreId, score }
 * @param {Array} userPlatforms - User's selected platform IDs
 * @param {string} region - Region code
 * @returns {Array} Content items with source metadata
 */
const fetchGenreBasedContent = async (topGenres, userPlatforms = [], region = 'GB') => {
  try {
    if (topGenres.length === 0) {
      if (DEBUG) console.log('[RecommendationEngine] No top genres, using popular content');
      // Fallback to popular content
      const [moviesRes, tvRes] = await Promise.all([
        discoverMovies({ page: 1, watch_region: region }),
        discoverTV({ page: 1, watch_region: region }),
      ]);

      const movies = (moviesRes.data?.results || []).map((m) => ({
        ...m,
        type: 'movie',
        source: 'popular',
        genreMatch: [],
      }));

      const tvShows = (tvRes.data?.results || []).map((t) => ({
        ...t,
        type: 'tv',
        source: 'popular',
        genreMatch: [],
      }));

      return [...movies, ...tvShows];
    }

    // Fetch content for top genres (batch)
    const genreIds = topGenres.map((g) => g.genreId);
    const genreString = genreIds.join(',');

    const [moviesRes, tvRes] = await Promise.all([
      discoverMovies({
        with_genres: genreString,
        page: 1,
        watch_region: region,
        sort_by: 'popularity.desc',
      }),
      discoverTV({
        with_genres: genreString,
        page: 1,
        watch_region: region,
        sort_by: 'popularity.desc',
      }),
    ]);

    const movies = (moviesRes.data?.results || []).map((m) => ({
      ...m,
      type: 'movie',
      source: 'genre',
      genreMatch: genreIds.filter((gId) => (m.genre_ids || []).includes(gId)),
    }));

    const tvShows = (tvRes.data?.results || []).map((t) => ({
      ...t,
      type: 'tv',
      source: 'genre',
      genreMatch: genreIds.filter((gId) => (t.genre_ids || []).includes(gId)),
    }));

    return [...movies, ...tvShows];
  } catch (error) {
    console.error('[RecommendationEngine] Error fetching genre content:', error);
    return [];
  }
};

/**
 * Fetch similar content for liked items
 * @param {Array} likedItems - Top liked watchlist items
 * @returns {Array} Similar content items with source metadata
 */
const fetchSimilarContent = async (likedItems) => {
  try {
    if (likedItems.length === 0) {
      return [];
    }

    // Batch fetch similar content for all liked items
    const similarPromises = likedItems.map((item) => {
      if (item.type === 'movie') {
        return getSimilarMovies(item.id);
      } else {
        return getSimilarTV(item.id);
      }
    });

    const results = await Promise.all(similarPromises);

    // Flatten and annotate with source
    const allSimilar = [];
    results.forEach((result, index) => {
      if (result.success && result.data?.results) {
        const sourceItem = likedItems[index];
        result.data.results.forEach((item) => {
          allSimilar.push({
            ...item,
            type: sourceItem.type,
            source: 'similar',
            similarTo: sourceItem.metadata?.title || 'a title you liked',
            similarToId: sourceItem.id,
          });
        });
      }
    });

    return allSimilar;
  } catch (error) {
    console.error('[RecommendationEngine] Error fetching similar content:', error);
    return [];
  }
};

/**
 * Score a candidate item based on user preferences
 * @param {Object} item - Content item
 * @param {Object} affinities - Genre affinity map
 * @param {string} source - 'genre' or 'similar'
 * @returns {number} Score (0-100)
 */
const scoreCandidate = (item, affinities, source) => {
  let score = 0;

  // Genre affinity contribution
  const genreIds = item.genre_ids || [];
  let genreScore = 0;
  genreIds.forEach((genreId) => {
    genreScore += affinities[genreId] || 0;
  });
  // Normalize genre score (assuming max affinity ~10)
  const normalizedGenreScore = Math.min(genreScore / 10, 1) * 100;

  // Apply weight based on source
  if (source === 'genre') {
    score += normalizedGenreScore * WEIGHTS.GENRE_AFFINITY;
  } else if (source === 'similar') {
    // Similar content gets a base score + genre bonus
    score += 50 * WEIGHTS.SIMILAR_CONTENT; // Base score for being similar
    score += normalizedGenreScore * WEIGHTS.GENRE_AFFINITY * 0.5; // Partial genre bonus
  }

  // Popularity boost (0-10 points)
  const popularity = item.popularity || 0;
  const popularityBoost = Math.min(popularity / 100, 1) * 10;
  score += popularityBoost;

  // Rating boost (items rated 7+ get bonus)
  const rating = item.vote_average || 0;
  if (rating >= 7) {
    score += (rating - 7) * 3; // Up to 9 extra points for 10-rated content
  }

  return Math.round(score * 100) / 100; // Round to 2 decimal places
};

/**
 * Apply diversity filter to ensure variety in recommendations
 * @param {Array} rankedItems - Scored and sorted items
 * @param {number} maxPerGenre - Max items per primary genre in top 10
 * @param {number} targetCount - Target number of recommendations
 * @returns {Array} Diversified recommendations
 */
const applyDiversityFilter = (rankedItems, maxPerGenre = 3, targetCount = 20) => {
  const result = [];
  const genreCounts = {};
  const seenIds = new Set();

  for (const item of rankedItems) {
    // Skip duplicates
    const uniqueKey = `${item.type}-${item.id}`;
    if (seenIds.has(uniqueKey)) continue;

    // Find primary genre (first in list)
    const primaryGenre = (item.genre_ids || [])[0];

    // In top 10, enforce diversity
    if (result.length < 10 && primaryGenre) {
      if ((genreCounts[primaryGenre] || 0) >= maxPerGenre) {
        continue; // Skip this genre, try next item
      }
    }

    // Add to results
    result.push(item);
    seenIds.add(uniqueKey);
    if (primaryGenre) {
      genreCounts[primaryGenre] = (genreCounts[primaryGenre] || 0) + 1;
    }

    if (result.length >= targetCount) break;
  }

  return result;
};

/**
 * Generate "reason" text for a recommendation
 * @param {Object} item - Recommendation item
 * @param {Object} affinities - Genre affinities
 * @returns {string} Reason text
 */
const generateReasonText = (item, affinities) => {
  if (item.source === 'similar' && item.similarTo) {
    return `Similar to ${item.similarTo}`;
  }

  // Find best matching genre
  const genreIds = item.genreMatch || item.genre_ids || [];
  let bestGenre = null;
  let bestScore = 0;

  genreIds.forEach((genreId) => {
    const score = affinities[genreId] || 0;
    if (score > bestScore) {
      bestScore = score;
      bestGenre = genreId;
    }
  });

  if (bestGenre && GENRE_NAMES[bestGenre]) {
    return `Because you like ${GENRE_NAMES[bestGenre]}`;
  }

  return 'Popular in your region';
};

/**
 * Main recommendation generation function
 * @param {Array} userPlatforms - User's selected platform IDs
 * @param {string} region - Region code
 * @returns {Array} Personalized recommendations
 */
export const generateRecommendations = async (userPlatforms = [], region = 'GB') => {
  try {
    // Clean expired dismissals periodically
    await cleanExpiredDismissals();

    // Check if cache is valid
    const cached = await getCachedRecommendations();
    const isValid = await isRecommendationCacheValid(cached);

    if (isValid && cached.recommendations.length > 0) {
      if (DEBUG) console.log('[RecommendationEngine] Using cached recommendations');
      return cached.recommendations;
    }

    if (DEBUG) console.log('[RecommendationEngine] Generating fresh recommendations');

    // Step 1: Calculate genre affinities
    const affinities = await calculateGenreAffinities();

    // Step 2: Get top genres
    const topGenres = getTopGenres(affinities, 3);
    if (DEBUG) console.log('[RecommendationEngine] Top genres:', topGenres);

    // Step 3: Get top liked items
    const likedItems = await getTopLikedItems(3);
    if (DEBUG) console.log('[RecommendationEngine] Liked items:', likedItems.length);

    // Step 4: Fetch candidate content (parallel)
    const [genreContent, similarContent] = await Promise.all([
      fetchGenreBasedContent(topGenres, userPlatforms, region),
      fetchSimilarContent(likedItems),
    ]);

    if (DEBUG) {
      console.log('[RecommendationEngine] Genre content:', genreContent.length);
      console.log('[RecommendationEngine] Similar content:', similarContent.length);
    }

    // Step 5: Combine and score all candidates
    const allCandidates = [...genreContent, ...similarContent];

    const scored = allCandidates.map((item) => ({
      ...item,
      score: scoreCandidate(item, affinities, item.source),
    }));

    // Step 6: Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Step 7: Filter out items already in watchlist
    const watchlist = await getWatchlist();
    const watchlistIds = new Set(
      watchlist.items.map((i) => `${i.type}-${i.id}`)
    );

    const filteredByWatchlist = scored.filter(
      (item) => !watchlistIds.has(`${item.type}-${item.id}`)
    );

    // Step 8: Filter out dismissed recommendations
    const dismissedIds = await getDismissedIds();
    const filteredByDismissed = filteredByWatchlist.filter(
      (item) => !dismissedIds.has(`${item.type}-${item.id}`)
    );

    // Step 9: Apply diversity filter
    const diverse = applyDiversityFilter(filteredByDismissed, 3, 20);

    // Step 10: Format final recommendations
    const recommendations = diverse.map((item) => ({
      id: item.id,
      type: item.type,
      score: item.score,
      reason: generateReasonText(item, affinities),
      source: item.source,
      metadata: {
        title: item.title || item.name,
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        overview: item.overview,
        releaseDate: item.release_date || item.first_air_date,
        voteAverage: item.vote_average,
        genreIds: item.genre_ids || [],
        popularity: item.popularity,
      },
    }));

    // Step 11: Cache results
    await setCachedRecommendations(recommendations, {
      genreAffinities: affinities,
      likedItemIds: likedItems.map((i) => i.id),
    });

    if (DEBUG) {
      console.log('[RecommendationEngine] Generated', recommendations.length, 'recommendations');
    }

    return recommendations;
  } catch (error) {
    console.error('[RecommendationEngine] Error generating recommendations:', error);
    return [];
  }
};

/**
 * Force regenerate recommendations (invalidates cache)
 * @param {Array} userPlatforms - User's selected platform IDs
 * @param {string} region - Region code
 * @returns {Array} Fresh recommendations
 */
export const refreshRecommendations = async (userPlatforms = [], region = 'GB') => {
  try {
    // Clear cache to force regeneration
    const { clearRecommendationCache } = await import('../storage/recommendations');
    await clearRecommendationCache();

    return await generateRecommendations(userPlatforms, region);
  } catch (error) {
    console.error('[RecommendationEngine] Error refreshing recommendations:', error);
    return [];
  }
};

export default {
  generateRecommendations,
  refreshRecommendations,
  calculateGenreAffinities,
  getTopGenres,
  getTopLikedItems,
};
