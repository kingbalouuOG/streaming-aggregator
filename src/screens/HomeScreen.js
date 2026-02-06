import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Pressable,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, layout } from '../theme';
import { getSelectedPlatforms, getHomeGenres } from '../storage/userPreferences';
import { GENRE_NAMES } from '../constants/genres';
import { discoverMovies, discoverTV, getContentWatchProviders } from '../api/tmdb';
import { maintainCache } from '../api/cache';
import { mapRentBuyToSubscription, normalizePlatformName, mapProviderIdToCanonical } from '../constants/platforms';
import { DEFAULT_REGION, SPECIAL_GENRE_IDS, API_CONFIG, CACHE_CONFIG } from '../constants/config';
import ContentCard from '../components/ContentCard';
import RecommendationCard from '../components/RecommendationCard';
import FilterChip from '../components/FilterChip';
import FilterModal from '../components/FilterModal';
import ErrorMessage from '../components/ErrorMessage';
import { throttle, ImageCacheManager } from '../utils/performanceUtils';
import { logError } from '../utils/errorHandler';
import { generateRecommendations } from '../utils/recommendationEngine';
import { addToWatchlist } from '../storage/watchlist';

// Use centralized config constant
const DOCUMENTARY_GENRE_ID = SPECIAL_GENRE_IDS.DOCUMENTARY;

// Card sizing constants for FlatList optimization
const CARD_WIDTH = SCREEN_WIDTH * 0.4;
const CARD_MARGIN = 12; // spacing.md
const ITEM_WIDTH = CARD_WIDTH + CARD_MARGIN;

// getItemLayout for horizontal FlatList optimization
const getHorizontalItemLayout = (data, index) => ({
  length: ITEM_WIDTH,
  offset: ITEM_WIDTH * index,
  index,
});

// Default filter state
const DEFAULT_FILTERS = {
  selectedServices: [],    // Platform IDs (empty = all user platforms)
  contentType: 'all',      // 'all' | 'movies' | 'tv' | 'documentaries'
  costFilter: 'all',       // 'all' | 'free' (flatrate) | 'paid' (rent/buy)
  selectedGenres: [],      // Genre IDs
  minRating: 0,            // 0-10 (0 = no filter)
};

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [platforms, setPlatforms] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [popularContent, setPopularContent] = useState([]);
  const [highestRatedContent, setHighestRatedContent] = useState([]);
  const [recentContent, setRecentContent] = useState([]);
  const [homeGenres, setHomeGenres] = useState([]);
  // Genre sections now store: { [genreId]: { data: [], page: 1, hasMore: true, isLoading: false } }
  const [genreSections, setGenreSections] = useState({});
  // Pagination state for main sections
  const [sectionPagination, setSectionPagination] = useState({
    popular: { page: 1, hasMore: true, isLoading: false },
    highestRated: { page: 1, hasMore: true, isLoading: false },
    recent: { page: 1, hasMore: true, isLoading: false },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [error, setError] = useState(null);
  // Focus key to trigger watchlist status refresh in child cards
  const [focusKey, setFocusKey] = useState(0);

  useEffect(() => {
    // Run cache maintenance on app start to prevent storage full errors
    maintainCache(CACHE_CONFIG.MAX_ENTRIES).catch(err => console.warn('[HomeScreen] Cache maintenance failed:', err));
    loadContent();
    // Load recommendations in parallel (non-blocking)
    loadRecommendations();
  }, []);

  // Load personalized recommendations
  const loadRecommendations = async () => {
    try {
      setIsLoadingRecommendations(true);
      const recs = await generateRecommendations(platforms, DEFAULT_REGION);
      setRecommendations(recs);
    } catch (error) {
      console.error('[HomeScreen] Error loading recommendations:', error);
      // Silently fail - recommendations are not critical
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // Handle recommendation card press
  const handleRecommendationPress = (item) => {
    navigation.navigate('Detail', {
      itemId: item.id,
      type: item.type,
      isPaidTitle: false,
    });
  };

  // Reload platforms and refresh watchlist state when screen gains focus
  useFocusEffect(
    useCallback(() => {
      // Increment focusKey to trigger watchlist status refresh in child cards
      setFocusKey(prev => prev + 1);

      const reloadPlatforms = async () => {
        try {
          const platformIds = await getSelectedPlatforms();
          const platformsChanged =
            JSON.stringify([...platformIds].sort()) !== JSON.stringify([...platforms].sort());

          if (platformsChanged && platforms.length > 0) {
            console.log('[HomeScreen] Platforms changed, reloading content');
            setPlatforms(platformIds);
            loadContent();
          }
        } catch (error) {
          console.error('[HomeScreen] Error reloading platforms:', error);
        }
      };

      reloadPlatforms();
    }, [platforms])
  );

  useEffect(() => {
    // Reload content when filters change
    if (platforms.length > 0) {
      loadContent();
    }
  }, [filters]);

  // Load user's platforms and fetch content with cross-section deduplication
  const loadContent = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get user's selected platforms
      const platformIds = await getSelectedPlatforms();
      setPlatforms(platformIds);

      if (platformIds.length === 0) {
        console.log('[HomeScreen] No platforms selected');
        setIsLoading(false);
        return;
      }

      // Get user's selected home genres
      const userGenres = await getHomeGenres();
      setHomeGenres(userGenres);

      // Global exclusion set to prevent duplicates across sections
      const exclusionSet = new Set();

      // 1. Popular (highest priority - no exclusions)
      const popular = await fetchPopularContentWithExclusion(platformIds, exclusionSet);
      popular.forEach(item => exclusionSet.add(`${item.type}-${item.id}`));
      setPopularContent(popular);

      // Preload first batch of images for instant display (non-blocking)
      const imagesToPreload = popular
        .slice(0, 10)
        .filter(item => item.poster_path)
        .map(item => `https://image.tmdb.org/t/p/w342${item.poster_path}`);
      ImageCacheManager.preload(imagesToPreload).catch(() => {});

      // 2. Highest Rated (exclude popular)
      const highestRated = await fetchHighestRatedContentWithExclusion(platformIds, exclusionSet);
      highestRated.forEach(item => exclusionSet.add(`${item.type}-${item.id}`));
      setHighestRatedContent(highestRated);

      // 3. Recently Added (exclude popular + highest rated)
      const recent = await fetchRecentContentWithExclusion(platformIds, exclusionSet);
      recent.forEach(item => exclusionSet.add(`${item.type}-${item.id}`));
      setRecentContent(recent);

      // 4. Genre sections (exclude all above)
      await fetchAllGenreSections(platformIds, userGenres, exclusionSet);
    } catch (err) {
      logError(err, 'HomeScreen loadContent');
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all genre sections based on user preferences with deduplication
  const fetchAllGenreSections = async (platformIds, genreIds, exclusionSet) => {
    const newGenreSections = {};

    // Fetch genres sequentially to properly deduplicate across all genre sections
    for (const genreId of genreIds) {
      const result = await fetchGenreSectionContentPaginated(platformIds, genreId, exclusionSet, 1, []);
      result.data.forEach(item => exclusionSet.add(`${item.type}-${item.id}`));
      newGenreSections[genreId] = {
        data: result.data,
        page: 1,
        hasMore: result.hasMore,
        isLoading: false,
      };
    }

    setGenreSections(newGenreSections);
  };

  // Helper to filter out excluded content
  const filterExcluded = (content, exclusionSet) => {
    return content.filter(item => !exclusionSet.has(`${item.type}-${item.id}`));
  };

  // Fetch content for a single genre section with pagination support
  // Returns { data: [], hasMore: boolean }
  const fetchGenreSectionContentPaginated = async (platformIds, genreId, exclusionSet = new Set(), page = 1, existingData = []) => {
    try {
      // If documentaries filter is active and this isn't the documentary genre, skip
      if (filters.contentType === 'documentaries' && genreId !== DOCUMENTARY_GENRE_ID) {
        return { data: [], hasMore: false };
      }

      const allContent = [];
      const genreParams = getGenreParams();
      const ratingParams = getRatingParams();
      const filteredPlatforms = getFilteredPlatforms(platformIds);

      // Query all platforms at once using | (OR) operator
      const platformsParam = filteredPlatforms.join('|');

      // Combine the section genre with any user-selected genres from modal
      const combinedGenres = genreParams.with_genres
        ? `${genreId},${genreParams.with_genres}`
        : genreId.toString();

      let totalResults = 0;

      if (shouldFetchMovies()) {
        const moviesResponse = await discoverMovies({
          watch_region: DEFAULT_REGION,
          with_watch_providers: platformsParam,
          with_genres: combinedGenres,
          sort_by: 'popularity.desc',
          page,
          ...ratingParams,
        });

        if (moviesResponse.success && moviesResponse.data.results) {
          totalResults += moviesResponse.data.results.length;
          allContent.push(
            ...moviesResponse.data.results.map((item) => ({
              ...item,
              type: 'movie',
              platforms: null,
            }))
          );
        }
      }

      if (shouldFetchTV()) {
        const tvResponse = await discoverTV({
          watch_region: DEFAULT_REGION,
          with_watch_providers: platformsParam,
          with_genres: combinedGenres,
          sort_by: 'popularity.desc',
          page,
          ...ratingParams,
        });

        if (tvResponse.success && tvResponse.data.results) {
          totalResults += tvResponse.data.results.length;
          allContent.push(
            ...tvResponse.data.results.map((item) => ({
              ...item,
              type: 'tv',
              platforms: null,
            }))
          );
        }
      }

      const deduped = deduplicateContent(allContent);

      // Filter out content already in existing data AND exclusion set
      const existingIds = new Set(existingData.map(item => `${item.type}-${item.id}`));
      const withoutExcluded = deduped.filter(item => {
        const key = `${item.type}-${item.id}`;
        return !exclusionSet.has(key) && !existingIds.has(key);
      });

      // Apply cost filter if active (fetch more to compensate for exclusions)
      const filtered = await applyCostFilter(withoutExcluded.slice(0, 40), platformIds);
      const newItems = filtered.slice(0, 20);

      // Determine if there are more results (TMDb typically returns 20 per page)
      const hasMore = totalResults >= 15 && newItems.length > 0;

      return { data: newItems, hasMore };
    } catch (error) {
      console.error(`[HomeScreen] Error fetching genre ${genreId} content page ${page}:`, error);
      return { data: [], hasMore: false };
    }
  };

  // Handle pull-to-refresh (with same deduplication logic as loadContent)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const platformIds = await getSelectedPlatforms();
      setPlatforms(platformIds);

      if (platformIds.length === 0) {
        setIsRefreshing(false);
        return;
      }

      // Reset pagination state
      setSectionPagination({
        popular: { page: 1, hasMore: true, isLoading: false },
        highestRated: { page: 1, hasMore: true, isLoading: false },
        recent: { page: 1, hasMore: true, isLoading: false },
      });

      // Get user's selected home genres
      const userGenres = await getHomeGenres();
      setHomeGenres(userGenres);

      // Global exclusion set to prevent duplicates across sections
      const exclusionSet = new Set();

      // 1. Popular (highest priority - no exclusions)
      const popular = await fetchPopularContentWithExclusion(platformIds, exclusionSet);
      popular.forEach(item => exclusionSet.add(`${item.type}-${item.id}`));
      setPopularContent(popular);

      // 2. Highest Rated (exclude popular)
      const highestRated = await fetchHighestRatedContentWithExclusion(platformIds, exclusionSet);
      highestRated.forEach(item => exclusionSet.add(`${item.type}-${item.id}`));
      setHighestRatedContent(highestRated);

      // 3. Recently Added (exclude popular + highest rated)
      const recent = await fetchRecentContentWithExclusion(platformIds, exclusionSet);
      recent.forEach(item => exclusionSet.add(`${item.type}-${item.id}`));
      setRecentContent(recent);

      // 4. Genre sections (exclude all above) - pagination reset handled in fetchAllGenreSections
      await fetchAllGenreSections(platformIds, userGenres, exclusionSet);

      // 5. Refresh recommendations (parallel, non-blocking)
      loadRecommendations();
    } catch (err) {
      logError(err, 'HomeScreen handleRefresh');
      setError(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch popular content with exclusion support (returns content array)
  const fetchPopularContentWithExclusion = async (platformIds, exclusionSet = new Set()) => {
    try {
      const allContent = [];
      const genreParams = getGenreParams();
      const ratingParams = getRatingParams();
      const filteredPlatforms = getFilteredPlatforms(platformIds);

      // Query all platforms at once using | (OR) operator
      const platformsParam = filteredPlatforms.join('|');

      if (shouldFetchMovies()) {
        const moviesResponse = await discoverMovies({
          watch_region: DEFAULT_REGION,
          with_watch_providers: platformsParam,
          sort_by: 'popularity.desc',
          page: 1,
          ...genreParams,
          ...ratingParams,
        });

        if (moviesResponse.success && moviesResponse.data.results) {
          allContent.push(
            ...moviesResponse.data.results.map((item) => ({
              ...item,
              type: 'movie',
              platforms: null,
            }))
          );
        }
      }

      if (shouldFetchTV()) {
        const tvResponse = await discoverTV({
          watch_region: DEFAULT_REGION,
          with_watch_providers: platformsParam,
          sort_by: 'popularity.desc',
          page: 1,
          ...genreParams,
          ...ratingParams,
        });

        if (tvResponse.success && tvResponse.data.results) {
          allContent.push(
            ...tvResponse.data.results.map((item) => ({
              ...item,
              type: 'tv',
              platforms: null,
            }))
          );
        }
      }

      // Deduplicate by ID
      const deduped = deduplicateContent(allContent);

      // Filter out content already shown in previous sections
      const withoutExcluded = filterExcluded(deduped, exclusionSet);

      // Apply cost filter if active (fetch more to compensate for exclusions)
      const filtered = await applyCostFilter(withoutExcluded.slice(0, 40), platformIds);
      return filtered.slice(0, 20);
    } catch (error) {
      console.error('[HomeScreen] Error fetching popular content:', error);
      return [];
    }
  };

  // Fetch recently added content with exclusion support (returns content array)
  const fetchRecentContentWithExclusion = async (platformIds, exclusionSet = new Set()) => {
    try {
      const allContent = [];
      const genreParams = getGenreParams();
      const ratingParams = getRatingParams();
      const filteredPlatforms = getFilteredPlatforms(platformIds);

      // Query all platforms at once using | (OR) operator
      const platformsParam = filteredPlatforms.join('|');

      if (shouldFetchMovies()) {
        const moviesResponse = await discoverMovies({
          watch_region: DEFAULT_REGION,
          with_watch_providers: platformsParam,
          sort_by: 'release_date.desc',
          'release_date.lte': new Date().toISOString().split('T')[0],
          page: 1,
          ...genreParams,
          ...ratingParams,
        });

        if (moviesResponse.success && moviesResponse.data.results) {
          allContent.push(
            ...moviesResponse.data.results.map((item) => ({
              ...item,
              type: 'movie',
              platforms: null,
            }))
          );
        }
      }

      if (shouldFetchTV()) {
        const tvResponse = await discoverTV({
          watch_region: DEFAULT_REGION,
          with_watch_providers: platformsParam,
          sort_by: 'first_air_date.desc',
          'first_air_date.lte': new Date().toISOString().split('T')[0],
          page: 1,
          ...genreParams,
          ...ratingParams,
        });

        if (tvResponse.success && tvResponse.data.results) {
          allContent.push(
            ...tvResponse.data.results.map((item) => ({
              ...item,
              type: 'tv',
              platforms: null,
            }))
          );
        }
      }

      const deduped = deduplicateContent(allContent);

      // Filter out content already shown in previous sections
      const withoutExcluded = filterExcluded(deduped, exclusionSet);

      // Apply cost filter if active (fetch more to compensate for exclusions)
      const filtered = await applyCostFilter(withoutExcluded.slice(0, 40), platformIds);
      return filtered.slice(0, 20);
    } catch (error) {
      console.error('[HomeScreen] Error fetching recent content:', error);
      return [];
    }
  };

  // Fetch highest rated content with exclusion support (returns content array)
  const fetchHighestRatedContentWithExclusion = async (platformIds, exclusionSet = new Set()) => {
    try {
      const allContent = [];
      const genreParams = getGenreParams();
      const ratingParams = getRatingParams();
      const filteredPlatforms = getFilteredPlatforms(platformIds);

      // Query all platforms at once using | (OR) operator
      const platformsParam = filteredPlatforms.join('|');

      if (shouldFetchMovies()) {
        const moviesResponse = await discoverMovies({
          watch_region: DEFAULT_REGION,
          with_watch_providers: platformsParam,
          sort_by: 'vote_average.desc',
          'vote_count.gte': 100, // Ensure reliable ratings
          page: 1,
          ...genreParams,
          ...ratingParams,
        });

        if (moviesResponse.success && moviesResponse.data.results) {
          allContent.push(
            ...moviesResponse.data.results.map((item) => ({
              ...item,
              type: 'movie',
              platforms: null,
            }))
          );
        }
      }

      if (shouldFetchTV()) {
        const tvResponse = await discoverTV({
          watch_region: DEFAULT_REGION,
          with_watch_providers: platformsParam,
          sort_by: 'vote_average.desc',
          'vote_count.gte': 100, // Ensure reliable ratings
          page: 1,
          ...genreParams,
          ...ratingParams,
        });

        if (tvResponse.success && tvResponse.data.results) {
          allContent.push(
            ...tvResponse.data.results.map((item) => ({
              ...item,
              type: 'tv',
              platforms: null,
            }))
          );
        }
      }

      // Sort by vote_average descending (highest rated first)
      const sorted = allContent.sort(
        (a, b) => (b.vote_average || 0) - (a.vote_average || 0)
      );

      const deduped = deduplicateContent(sorted);

      // Filter out content already shown in previous sections
      const withoutExcluded = filterExcluded(deduped, exclusionSet);

      // Apply cost filter if active (fetch more to compensate for exclusions)
      const filtered = await applyCostFilter(withoutExcluded.slice(0, 40), platformIds);
      return filtered.slice(0, 20);
    } catch (error) {
      console.error('[HomeScreen] Error fetching highest rated content:', error);
      return [];
    }
  };

  // Deduplicate content by ID and sort by popularity
  const deduplicateContent = (contentArray) => {
    const contentMap = new Map();

    contentArray.forEach((item) => {
      const key = `${item.type}-${item.id}`;
      if (!contentMap.has(key)) {
        contentMap.set(key, item);
      }
    });

    // Convert to array and sort by popularity
    return Array.from(contentMap.values()).sort(
      (a, b) => (b.popularity || 0) - (a.popularity || 0)
    );
  };

  // Apply cost filter by fetching watch providers and filtering
  // ALWAYS fetches ALL platforms (subscription + rent/buy) for unified display
  // Paid: Content with ONLY rent/buy availability (no subscription)
  // Free: Content that HAS subscription (even if also has rent/buy)
  const applyCostFilter = async (contentArray, platformIds) => {
    // Fetch watch providers for all items in parallel (with batching)
    const BATCH_SIZE = 10;
    const results = [];
    const userPlatformIds = platformIds.map(p => typeof p === 'object' ? p.id : p);

    for (let i = 0; i < contentArray.length; i += BATCH_SIZE) {
      const batch = contentArray.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (item) => {
          const mediaType = item.type === 'tv' ? 'tv' : 'movie';
          const response = await getContentWatchProviders(item.id, mediaType);

          if (!response.success) {
            // If we can't fetch data, include with null platforms
            return {
              item: { ...item, platforms: null },
              hasSubscription: false,
              hasPaidOnly: false,
            };
          }

          const { flatrate = [], rent = [], buy = [] } = response.data;

          // Collect ALL platforms for this item (subscription + rent/buy)
          const allPlatforms = [];
          const seenIds = new Set();

          // 1. Add subscription platforms first
          flatrate.filter(p => {
            const canonicalId = mapProviderIdToCanonical(p.provider_id);
            return userPlatformIds.includes(canonicalId) || userPlatformIds.includes(p.provider_id);
          }).forEach(p => {
            const canonicalId = mapProviderIdToCanonical(p.provider_id);
            if (!seenIds.has(canonicalId)) {
              seenIds.add(canonicalId);
              allPlatforms.push({
                id: canonicalId,
                name: normalizePlatformName(p.provider_name),
                availableFor: 'subscription',
              });
            }
          });

          // 2. Process rent/buy platforms (deduplicated)
          const paidPlatformMap = new Map();

          // Process rent platforms
          rent.filter(p => {
            const mappedId = mapRentBuyToSubscription(p.provider_id);
            return userPlatformIds.includes(mappedId) || userPlatformIds.includes(p.provider_id);
          }).forEach(p => {
            const mappedId = mapRentBuyToSubscription(p.provider_id);
            paidPlatformMap.set(mappedId, {
              id: mappedId,
              name: normalizePlatformName(p.provider_name),
              availableFor: 'rent',
            });
          });

          // Process buy platforms (merge with existing rent if present)
          buy.filter(p => {
            const mappedId = mapRentBuyToSubscription(p.provider_id);
            return userPlatformIds.includes(mappedId) || userPlatformIds.includes(p.provider_id);
          }).forEach(p => {
            const mappedId = mapRentBuyToSubscription(p.provider_id);
            const existing = paidPlatformMap.get(mappedId);
            if (existing) {
              paidPlatformMap.set(mappedId, {
                ...existing,
                availableFor: 'rent_buy',
              });
            } else {
              paidPlatformMap.set(mappedId, {
                id: mappedId,
                name: normalizePlatformName(p.provider_name),
                availableFor: 'buy',
              });
            }
          });

          // 3. Merge rent/buy into allPlatforms (mark if platform has both subscription AND rent/buy)
          paidPlatformMap.forEach((paidPlatform) => {
            const existingIndex = allPlatforms.findIndex(p => p.id === paidPlatform.id);
            if (existingIndex >= 0) {
              // Same platform has BOTH subscription AND rent/buy
              allPlatforms[existingIndex] = {
                ...allPlatforms[existingIndex],
                hasRentBuy: true,
                rentBuyType: paidPlatform.availableFor,
              };
            } else if (!seenIds.has(paidPlatform.id)) {
              // Platform only available for rent/buy, not subscription
              seenIds.add(paidPlatform.id);
              allPlatforms.push(paidPlatform);
            }
          });

          // Determine item classification
          const hasSubscription = allPlatforms.some(p => p.availableFor === 'subscription');
          const hasPaidOnly = !hasSubscription && paidPlatformMap.size > 0;

          return {
            item: { ...item, platforms: allPlatforms.length > 0 ? allPlatforms : null },
            hasSubscription,
            hasPaidOnly,
          };
        })
      );
      results.push(...batchResults);
    }

    // Filter based on cost type
    if (filters.costFilter === 'paid') {
      // Show items that are PAID-ONLY (no subscription option available)
      return results
        .filter(({ hasPaidOnly }) => hasPaidOnly)
        .map(({ item }) => item);
    } else if (filters.costFilter === 'free') {
      // Show items that HAVE subscription (even if they also have rent/buy)
      return results
        .filter(({ hasSubscription }) => hasSubscription)
        .map(({ item }) => item);
    } else {
      // 'all' - show everything with unified platform data
      return results.map(({ item }) => item);
    }
  };

  // Filter helpers
  const shouldFetchMovies = () => {
    return (
      filters.contentType === 'all' ||
      filters.contentType === 'movies' ||
      filters.contentType === 'documentaries'
    );
  };

  const shouldFetchTV = () => {
    return filters.contentType === 'all' || filters.contentType === 'tv';
  };

  // Get platforms to query (respects service filter)
  const getFilteredPlatforms = (platformIds) => {
    if (filters.selectedServices.length > 0) {
      return filters.selectedServices;
    }
    return platformIds;
  };

  // Get genre filter params based on content type and selected genres
  const getGenreParams = () => {
    const genres = [...filters.selectedGenres];

    // If documentaries filter is active, add documentary genre
    if (filters.contentType === 'documentaries') {
      if (!genres.includes(DOCUMENTARY_GENRE_ID)) {
        genres.push(DOCUMENTARY_GENRE_ID);
      }
    }

    return genres.length > 0 ? { with_genres: genres.join(',') } : {};
  };

  // Get rating filter params
  const getRatingParams = () => {
    if (filters.minRating > 0) {
      return { 'vote_average.gte': filters.minRating };
    }
    return {};
  };

  // Apply filters from modal
  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Count active filters for badge
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.selectedServices.length > 0) count++;
    if (filters.contentType !== 'all') count++;
    if (filters.costFilter !== 'all') count++;
    if (filters.selectedGenres.length > 0) count += filters.selectedGenres.length;
    if (filters.minRating > 0) count++;
    return count;
  };

  // Handle content card press
  const handleCardPress = (item) => {
    // Determine if this is a paid title based on platforms having availableFor property
    const isPaidTitle = item.platforms?.some(p =>
      p.availableFor && ['rent', 'buy', 'rent_buy'].includes(p.availableFor)
    );

    navigation.navigate('Detail', {
      itemId: item.id,
      type: item.type,
      isPaidTitle: isPaidTitle || false,
      preloadedPlatforms: isPaidTitle ? item.platforms : null,
    });
  };

  // Handle bookmark press on content cards
  const handleBookmarkPress = async (item) => {
    try {
      const metadata = {
        title: item.title || item.name,
        posterPath: item.poster_path,
        genreIds: item.genre_ids || [],
        voteAverage: item.vote_average,
      };
      await addToWatchlist(item.id, item.media_type || item.type || 'movie', metadata, 'want_to_watch');
    } catch (error) {
      console.error('[HomeScreen] Error adding to watchlist:', error);
    }
  };

  // Build exclusion set from all currently displayed content
  const buildExclusionSet = useCallback(() => {
    const exclusionSet = new Set();
    popularContent.forEach(item => exclusionSet.add(`${item.type}-${item.id}`));
    highestRatedContent.forEach(item => exclusionSet.add(`${item.type}-${item.id}`));
    recentContent.forEach(item => exclusionSet.add(`${item.type}-${item.id}`));
    Object.values(genreSections).forEach(section => {
      (section.data || []).forEach(item => exclusionSet.add(`${item.type}-${item.id}`));
    });
    return exclusionSet;
  }, [popularContent, highestRatedContent, recentContent, genreSections]);

  // Handle loading more content for a genre section (horizontal scroll pagination)
  const handleLoadMoreForGenre = useCallback(async (genreId) => {
    const section = genreSections[genreId];
    if (!section || section.isLoading || !section.hasMore) return;

    // Set loading state
    setGenreSections(prev => ({
      ...prev,
      [genreId]: { ...prev[genreId], isLoading: true }
    }));

    const nextPage = section.page + 1;
    const exclusionSet = buildExclusionSet();

    try {
      const result = await fetchGenreSectionContentPaginated(
        platforms,
        genreId,
        exclusionSet,
        nextPage,
        section.data
      );

      setGenreSections(prev => ({
        ...prev,
        [genreId]: {
          data: [...(prev[genreId]?.data || []), ...result.data],
          page: nextPage,
          hasMore: result.hasMore && result.data.length > 0,
          isLoading: false,
        }
      }));
    } catch (error) {
      console.error(`[HomeScreen] Error loading more for genre ${genreId}:`, error);
      setGenreSections(prev => ({
        ...prev,
        [genreId]: { ...prev[genreId], isLoading: false }
      }));
    }
  }, [platforms, genreSections, buildExclusionSet]);

  // Throttled version to prevent rapid API calls
  const throttledLoadMore = useMemo(
    () => throttle((genreId) => handleLoadMoreForGenre(genreId), 500),
    [handleLoadMoreForGenre]
  );

  // Render content section with optimizations and optional pagination
  const renderContentSection = (title, data, genreId = null) => {
    if (!data || data.length === 0) return null;

    // Get pagination state for genre sections
    const sectionState = genreId ? genreSections[genreId] : null;
    const isLoadingMore = sectionState?.isLoading || false;
    const hasMore = sectionState?.hasMore !== false;

    return (
      <View style={styles.section}>
        <Text style={[typography.h3, styles.sectionTitle]}>{title}</Text>
        <FlatList
          horizontal
          data={data}
          renderItem={({ item }) => (
            <ContentCard
              item={item}
              onPress={handleCardPress}
              onBookmarkPress={handleBookmarkPress}
              userPlatforms={platforms}
              focusKey={focusKey}
            />
          )}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          // Performance optimizations
          getItemLayout={getHorizontalItemLayout}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
          // Horizontal scroll pagination for genre sections
          onEndReached={genreId && hasMore && !isLoadingMore ? () => throttledLoadMore(genreId) : undefined}
          onEndReachedThreshold={0.5}
          // Loading indicator at end of list
          ListFooterComponent={
            genreId ? (
              isLoadingMore ? (
                <View style={styles.loadMoreContainer}>
                  <ActivityIndicator size="small" color={colors.accent.primary} />
                </View>
              ) : !hasMore && data.length >= 20 ? (
                <View style={styles.endOfListContainer}>
                  <Text style={styles.endOfListText}>•</Text>
                </View>
              ) : null
            ) : null
          }
        />
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={[typography.body, styles.loadingText]}>
            Loading content...
          </Text>
        </View>
      </View>
    );
  }

  // No platforms selected
  if (platforms.length === 0) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <View style={styles.emptyContainer}>
          <Text style={[typography.h2, styles.emptyTitle]}>No Platforms Selected</Text>
          <Text style={[typography.body, styles.emptyText]}>
            Please select streaming platforms in your profile
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && !isLoading && popularContent.length === 0) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <ErrorMessage error={error} onRetry={loadContent} />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]} />

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterBarWrapper}
          contentContainerStyle={styles.filterBar}
        >
          <FilterChip
            label="All"
            active={filters.contentType === 'all'}
            onPress={() => setFilters((prev) => ({ ...prev, contentType: 'all' }))}
          />
          <FilterChip
            label="Movies"
            active={filters.contentType === 'movies'}
            onPress={() => setFilters((prev) => ({ ...prev, contentType: 'movies' }))}
          />
          <FilterChip
            label="TV"
            active={filters.contentType === 'tv'}
            onPress={() => setFilters((prev) => ({ ...prev, contentType: 'tv' }))}
          />
          <FilterChip
            label="Documentaries"
            active={filters.contentType === 'documentaries'}
            onPress={() => setFilters((prev) => ({ ...prev, contentType: 'documentaries' }))}
          />
          <Pressable style={styles.filterIconButton} onPress={() => setFilterModalVisible(true)}>
            <Ionicons name="options-outline" size={20} color={colors.text.secondary} />
            {getActiveFilterCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
              </View>
            )}
          </Pressable>
        </ScrollView>

        {/* Content Sections */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent.primary}
              colors={[colors.accent.primary]}
              progressBackgroundColor={colors.background.secondary}
            />
          }
        >
          {/* For You - Personalized Recommendations */}
          {recommendations.length > 0 && (
            <View style={styles.section}>
              <Text style={[typography.h3, styles.sectionTitle]}>For You</Text>
              <FlatList
                horizontal
                data={recommendations.slice(0, 10)}
                renderItem={({ item }) => (
                  <RecommendationCard
                    item={item}
                    onPress={handleRecommendationPress}
                    focusKey={focusKey}
                  />
                )}
                keyExtractor={(item) => `rec-${item.type}-${item.id}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                getItemLayout={getHorizontalItemLayout}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                windowSize={5}
                removeClippedSubviews={true}
              />
            </View>
          )}
          {renderContentSection('Popular on Your Services', popularContent)}
          {renderContentSection('Highest Rated', highestRatedContent)}
          {renderContentSection('Recently Added', recentContent)}
          {/* Dynamic Genre Sections with horizontal scroll pagination */}
          {homeGenres.map((genreId) => (
            <React.Fragment key={`genre-${genreId}`}>
              {renderContentSection(
                GENRE_NAMES[genreId] || `Genre ${genreId}`,
                genreSections[genreId]?.data || [],
                genreId
              )}
            </React.Fragment>
          ))}
        </ScrollView>

        {/* Filter Modal */}
        <FilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          filters={filters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          userPlatforms={platforms}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background.primary,
  },
  headerLogo: {
    height: 32,
    width: 140,
  },
  filterBarWrapper: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  filterIconButton: {
    height: 36,
    width: 36,
    backgroundColor: colors.background.tertiary,
    borderRadius: layout.borderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.accent.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: colors.text.inverse,
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    color: colors.text.primary,
  },
  horizontalList: {
    paddingHorizontal: spacing.lg,
  },
  loadMoreContainer: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  endOfListContainer: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  endOfListText: {
    color: colors.text.tertiary,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default HomeScreen;
