import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, layout } from '../theme';
import { getSelectedPlatforms } from '../storage/userPreferences';
import { discoverMovies, discoverTV, getContentWatchProviders } from '../api/tmdb';
import { mapRentBuyToSubscription } from '../constants/platforms';
import ContentCard from '../components/ContentCard';
import FilterChip from '../components/FilterChip';
import FilterModal from '../components/FilterModal';

const DOCUMENTARY_GENRE_ID = 99;

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
  const [popularContent, setPopularContent] = useState([]);
  const [recentContent, setRecentContent] = useState([]);
  const [actionContent, setActionContent] = useState([]);
  const [comedyContent, setComedyContent] = useState([]);
  const [dramaContent, setDramaContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    // Reload content when filters change
    if (platforms.length > 0) {
      loadContent();
    }
  }, [filters]);

  // Load user's platforms and fetch content
  const loadContent = async () => {
    setIsLoading(true);
    try {
      // Get user's selected platforms
      const platformIds = await getSelectedPlatforms();
      setPlatforms(platformIds);

      if (platformIds.length === 0) {
        console.log('[HomeScreen] No platforms selected');
        setIsLoading(false);
        return;
      }

      // Fetch content from all platforms
      await Promise.all([
        fetchPopularContent(platformIds),
        fetchRecentContent(platformIds),
        fetchGenreContent(platformIds, 28, setActionContent), // Action
        fetchGenreContent(platformIds, 35, setComedyContent), // Comedy
        fetchGenreContent(platformIds, 18, setDramaContent), // Drama
      ]);
    } catch (error) {
      console.error('[HomeScreen] Error loading content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch popular content from all platforms
  const fetchPopularContent = async (platformIds) => {
    try {
      const allContent = [];
      const genreParams = getGenreParams();
      const ratingParams = getRatingParams();
      const filteredPlatforms = getFilteredPlatforms(platformIds);

      // Query all platforms at once using | (OR) operator
      const platformsParam = filteredPlatforms.join('|');

      if (shouldFetchMovies()) {
        const moviesResponse = await discoverMovies({
          watch_region: 'GB',
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
              platforms: null, // Will be lazy-loaded by ContentCard
            }))
          );
        }
      }

      if (shouldFetchTV()) {
        const tvResponse = await discoverTV({
          watch_region: 'GB',
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
              platforms: null, // Will be lazy-loaded by ContentCard
            }))
          );
        }
      }

      // Deduplicate by ID
      const deduped = deduplicateContent(allContent);

      // Apply cost filter if active
      const filtered = await applyCostFilter(deduped.slice(0, 30), platformIds);
      setPopularContent(filtered.slice(0, 20));
    } catch (error) {
      console.error('[HomeScreen] Error fetching popular content:', error);
    }
  };

  // Fetch recently added content
  const fetchRecentContent = async (platformIds) => {
    try {
      const allContent = [];
      const genreParams = getGenreParams();
      const ratingParams = getRatingParams();
      const filteredPlatforms = getFilteredPlatforms(platformIds);

      // Query all platforms at once using | (OR) operator
      const platformsParam = filteredPlatforms.join('|');

      if (shouldFetchMovies()) {
        const moviesResponse = await discoverMovies({
          watch_region: 'GB',
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
              platforms: null, // Will be lazy-loaded by ContentCard
            }))
          );
        }
      }

      if (shouldFetchTV()) {
        const tvResponse = await discoverTV({
          watch_region: 'GB',
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
              platforms: null, // Will be lazy-loaded by ContentCard
            }))
          );
        }
      }

      const deduped = deduplicateContent(allContent);

      // Apply cost filter if active
      const filtered = await applyCostFilter(deduped.slice(0, 30), platformIds);
      setRecentContent(filtered.slice(0, 20));
    } catch (error) {
      console.error('[HomeScreen] Error fetching recent content:', error);
    }
  };

  // Fetch content by genre
  const fetchGenreContent = async (platformIds, genreId, setter) => {
    try {
      // If documentaries filter is active and this isn't the documentary genre, skip
      if (filters.contentType === 'documentaries' && genreId !== DOCUMENTARY_GENRE_ID) {
        setter([]);
        return;
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

      if (shouldFetchMovies()) {
        const moviesResponse = await discoverMovies({
          watch_region: 'GB',
          with_watch_providers: platformsParam,
          with_genres: combinedGenres,
          sort_by: 'popularity.desc',
          page: 1,
          ...ratingParams,
        });

        if (moviesResponse.success && moviesResponse.data.results) {
          allContent.push(
            ...moviesResponse.data.results.map((item) => ({
              ...item,
              type: 'movie',
              platforms: null, // Will be lazy-loaded by ContentCard
            }))
          );
        }
      }

      if (shouldFetchTV()) {
        const tvResponse = await discoverTV({
          watch_region: 'GB',
          with_watch_providers: platformsParam,
          with_genres: combinedGenres,
          sort_by: 'popularity.desc',
          page: 1,
          ...ratingParams,
        });

        if (tvResponse.success && tvResponse.data.results) {
          allContent.push(
            ...tvResponse.data.results.map((item) => ({
              ...item,
              type: 'tv',
              platforms: null, // Will be lazy-loaded by ContentCard
            }))
          );
        }
      }

      const deduped = deduplicateContent(allContent);

      // Apply cost filter if active
      const filtered = await applyCostFilter(deduped.slice(0, 30), platformIds);
      setter(filtered.slice(0, 20));
    } catch (error) {
      console.error(`[HomeScreen] Error fetching genre ${genreId} content:`, error);
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
  // Paid: Content with rent/buy availability on user's platforms
  // Free: ALL OTHER RESULTS (everything that doesn't have rent/buy only)
  const applyCostFilter = async (contentArray, platformIds) => {
    // Skip if no cost filter applied
    if (filters.costFilter === 'all') {
      return contentArray;
    }

    // Fetch watch providers for all items in parallel (with batching)
    const BATCH_SIZE = 10;
    const results = [];

    for (let i = 0; i < contentArray.length; i += BATCH_SIZE) {
      const batch = contentArray.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (item) => {
          const mediaType = item.type === 'tv' ? 'tv' : 'movie';
          const response = await getContentWatchProviders(item.id, mediaType);

          if (!response.success) {
            // If we can't fetch data, include in "free" results, exclude from "paid"
            return {
              item,
              isPaid: false,
              platforms: null,
            };
          }

          const { flatrate = [], rent = [], buy = [] } = response.data;

          // Check if any of the user's platforms have rent/buy availability
          const userPlatformIds = platformIds.map(p => typeof p === 'object' ? p.id : p);

          // Get matching rent/buy platforms (using mapping to match store IDs to subscription IDs)
          // e.g., Amazon Video (10) maps to Amazon Prime Video (9)
          const matchingPaid = [...rent, ...buy].filter(p => {
            const mappedId = mapRentBuyToSubscription(p.provider_id);
            return userPlatformIds.includes(mappedId) || userPlatformIds.includes(p.provider_id);
          });

          // Item is "paid" if it has rent/buy availability on user's platforms
          const isPaid = matchingPaid.length > 0;

          // Pre-load platforms for paid items (show the mapped subscription platform ID)
          // This ensures Amazon Video (10) shows as Amazon Prime (9) badge
          const platforms = isPaid
            ? matchingPaid.map(p => {
                const mappedId = mapRentBuyToSubscription(p.provider_id);
                return { id: mappedId, name: p.provider_name };
              })
            : null; // Let ContentCard lazy-load for free items

          return {
            item: { ...item, platforms },
            isPaid,
          };
        })
      );
      results.push(...batchResults);
    }

    // Filter based on cost type
    if (filters.costFilter === 'paid') {
      // Paid: only items with rent/buy availability
      return results
        .filter(({ isPaid }) => isPaid)
        .map(({ item }) => item);
    } else {
      // Free: ALL OTHER RESULTS (everything that's not paid)
      return results
        .filter(({ isPaid }) => !isPaid)
        .map(({ item }) => item);
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
    navigation.navigate('Detail', {
      itemId: item.id,
      type: item.type,
    });
  };

  // Render content section
  const renderContentSection = (title, data) => {
    if (!data || data.length === 0) return null;

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
              userPlatforms={platforms}
            />
          )}
          keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
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

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Image
            source={require('../../assets/videx-logo-v1.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

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
        >
          {renderContentSection('Popular on Your Services', popularContent)}
          {renderContentSection('Recently Added', recentContent)}
          {renderContentSection('Action', actionContent)}
          {renderContentSection('Comedy', comedyContent)}
          {renderContentSection('Drama', dramaContent)}
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
