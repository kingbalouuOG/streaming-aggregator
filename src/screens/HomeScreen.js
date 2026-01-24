import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Pressable,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, layout } from '../theme';
import { getSelectedPlatforms } from '../storage/userPreferences';
import { discoverMovies, discoverTV } from '../api/tmdb';
import ContentCard from '../components/ContentCard';
import FilterChip from '../components/FilterChip';

const FILTERS = {
  ALL: 'all',
  MOVIES: 'movies',
  TV: 'tv',
  DOCUMENTARIES: 'documentaries',
};

const DOCUMENTARY_GENRE_ID = 99;

const GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

const HomeScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState(FILTERS.ALL);
  const [platforms, setPlatforms] = useState([]);
  const [popularContent, setPopularContent] = useState([]);
  const [recentContent, setRecentContent] = useState([]);
  const [actionContent, setActionContent] = useState([]);
  const [comedyContent, setComedyContent] = useState([]);
  const [dramaContent, setDramaContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    // Reload content when main filter changes
    if (platforms.length > 0) {
      loadContent();
    }
  }, [selectedFilter]);

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

      for (const platformId of platformIds) {
        // Fetch based on filter
        if (shouldFetchMovies()) {
          const moviesResponse = await discoverMovies({
            watch_region: 'GB',
            with_watch_providers: platformId,
            sort_by: 'popularity.desc',
            page: 1,
            ...genreParams,
          });

          if (moviesResponse.success && moviesResponse.data.results) {
            allContent.push(
              ...moviesResponse.data.results.map((item) => ({
                ...item,
                type: 'movie',
                platformId,
              }))
            );
          }
        }

        if (shouldFetchTV()) {
          const tvResponse = await discoverTV({
            watch_region: 'GB',
            with_watch_providers: platformId,
            sort_by: 'popularity.desc',
            page: 1,
            ...genreParams,
          });

          if (tvResponse.success && tvResponse.data.results) {
            allContent.push(
              ...tvResponse.data.results.map((item) => ({
                ...item,
                type: 'tv',
                platformId,
              }))
            );
          }
        }
      }

      // Merge and deduplicate by ID
      const merged = mergeAndDeduplicateContent(allContent, platformIds);
      setPopularContent(merged.slice(0, 20));
    } catch (error) {
      console.error('[HomeScreen] Error fetching popular content:', error);
    }
  };

  // Fetch recently added content
  const fetchRecentContent = async (platformIds) => {
    try {
      const allContent = [];
      const genreParams = getGenreParams();

      for (const platformId of platformIds) {
        if (shouldFetchMovies()) {
          const moviesResponse = await discoverMovies({
            watch_region: 'GB',
            with_watch_providers: platformId,
            sort_by: 'release_date.desc',
            'release_date.lte': new Date().toISOString().split('T')[0],
            page: 1,
            ...genreParams,
          });

          if (moviesResponse.success && moviesResponse.data.results) {
            allContent.push(
              ...moviesResponse.data.results.map((item) => ({
                ...item,
                type: 'movie',
                platformId,
              }))
            );
          }
        }

        if (shouldFetchTV()) {
          const tvResponse = await discoverTV({
            watch_region: 'GB',
            with_watch_providers: platformId,
            sort_by: 'first_air_date.desc',
            'first_air_date.lte': new Date().toISOString().split('T')[0],
            page: 1,
            ...genreParams,
          });

          if (tvResponse.success && tvResponse.data.results) {
            allContent.push(
              ...tvResponse.data.results.map((item) => ({
                ...item,
                type: 'tv',
                platformId,
              }))
            );
          }
        }
      }

      const merged = mergeAndDeduplicateContent(allContent, platformIds);
      setRecentContent(merged.slice(0, 20));
    } catch (error) {
      console.error('[HomeScreen] Error fetching recent content:', error);
    }
  };

  // Fetch content by genre
  const fetchGenreContent = async (platformIds, genreId, setter) => {
    try {
      // If documentaries filter is active and this isn't the documentary genre, skip
      if (selectedFilter === FILTERS.DOCUMENTARIES && genreId !== DOCUMENTARY_GENRE_ID) {
        setter([]);
        return;
      }

      const allContent = [];
      const genreParams = getGenreParams();

      // Combine the section genre with any user-selected genres from modal
      const combinedGenres = genreParams.with_genres
        ? `${genreId},${genreParams.with_genres}`
        : genreId.toString();

      for (const platformId of platformIds) {
        if (shouldFetchMovies()) {
          const moviesResponse = await discoverMovies({
            watch_region: 'GB',
            with_watch_providers: platformId,
            with_genres: combinedGenres,
            sort_by: 'popularity.desc',
            page: 1,
          });

          if (moviesResponse.success && moviesResponse.data.results) {
            allContent.push(
              ...moviesResponse.data.results.map((item) => ({
                ...item,
                type: 'movie',
                platformId,
              }))
            );
          }
        }

        if (shouldFetchTV()) {
          const tvResponse = await discoverTV({
            watch_region: 'GB',
            with_watch_providers: platformId,
            with_genres: combinedGenres,
            sort_by: 'popularity.desc',
            page: 1,
          });

          if (tvResponse.success && tvResponse.data.results) {
            allContent.push(
              ...tvResponse.data.results.map((item) => ({
                ...item,
                type: 'tv',
                platformId,
              }))
            );
          }
        }
      }

      const merged = mergeAndDeduplicateContent(allContent, platformIds);
      setter(merged.slice(0, 20));
    } catch (error) {
      console.error(`[HomeScreen] Error fetching genre ${genreId} content:`, error);
    }
  };

  // Merge content from multiple platforms and deduplicate
  const mergeAndDeduplicateContent = (contentArray, platformIds) => {
    const contentMap = new Map();

    contentArray.forEach((item) => {
      const key = `${item.type}-${item.id}`;

      if (contentMap.has(key)) {
        // Item exists, add platform to its list
        const existing = contentMap.get(key);
        const platform = platformIds.find((p) => p === item.platformId);
        if (platform && !existing.platforms.some((p) => p.id === platform)) {
          existing.platforms.push({ id: platform, name: getPlatformName(platform) });
        }
      } else {
        // New item
        contentMap.set(key, {
          ...item,
          platforms: [{ id: item.platformId, name: getPlatformName(item.platformId) }],
        });
      }
    });

    // Convert to array and sort by popularity
    return Array.from(contentMap.values()).sort(
      (a, b) => (b.popularity || 0) - (a.popularity || 0)
    );
  };

  // Get platform name by ID
  const getPlatformName = (id) => {
    const platformNames = {
      8: 'Netflix',
      9: 'Prime',
      350: 'Apple TV+',
      337: 'Disney+',
      39: 'Now TV',
      38: 'iPlayer',
      41: 'ITVX',
      103: 'C4',
    };
    return platformNames[id] || 'Unknown';
  };

  // Filter helpers
  const shouldFetchMovies = () => {
    return (
      selectedFilter === FILTERS.ALL ||
      selectedFilter === FILTERS.MOVIES ||
      selectedFilter === FILTERS.DOCUMENTARIES
    );
  };

  const shouldFetchTV = () => {
    return selectedFilter === FILTERS.ALL || selectedFilter === FILTERS.TV;
  };

  // Get genre filter params based on selected filter and additional genre filters
  const getGenreParams = () => {
    const genres = [...selectedGenres];

    // If documentaries filter is active, add documentary genre
    if (selectedFilter === FILTERS.DOCUMENTARIES) {
      if (!genres.includes(DOCUMENTARY_GENRE_ID)) {
        genres.push(DOCUMENTARY_GENRE_ID);
      }
    }

    return genres.length > 0 ? { with_genres: genres.join(',') } : {};
  };

  // Toggle genre selection for filter modal
  const toggleGenreSelection = (genreId) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  };

  // Apply genre filters and close modal
  const applyGenreFilters = () => {
    setFilterModalVisible(false);
    // Reload content with new genre filters
    if (platforms.length > 0) {
      loadContent();
    }
  };

  // Clear all genre filters
  const clearGenreFilters = () => {
    setSelectedGenres([]);
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
            <ContentCard item={item} onPress={handleCardPress} />
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={[typography.body, styles.loadingText]}>
            Loading content...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // No platforms selected
  if (platforms.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={[typography.h2, styles.emptyTitle]}>No Platforms Selected</Text>
          <Text style={[typography.body, styles.emptyText]}>
            Please select streaming platforms in your profile
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[typography.h2, styles.headerTitle]}>StreamFinder</Text>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          <FilterChip
            label="All"
            active={selectedFilter === FILTERS.ALL}
            onPress={() => setSelectedFilter(FILTERS.ALL)}
          />
          <FilterChip
            label="Movies"
            active={selectedFilter === FILTERS.MOVIES}
            onPress={() => setSelectedFilter(FILTERS.MOVIES)}
          />
          <FilterChip
            label="TV"
            active={selectedFilter === FILTERS.TV}
            onPress={() => setSelectedFilter(FILTERS.TV)}
          />
          <FilterChip
            label="Documentaries"
            active={selectedFilter === FILTERS.DOCUMENTARIES}
            onPress={() => setSelectedFilter(FILTERS.DOCUMENTARIES)}
          />
          <Pressable style={styles.filterIconButton} onPress={() => setFilterModalVisible(true)}>
            <Ionicons name="options-outline" size={20} color={colors.text.secondary} />
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
        <Modal
          visible={filterModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={[typography.h3, styles.modalTitle]}>Filter by Genre</Text>
                <Pressable onPress={() => setFilterModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </Pressable>
              </View>

              {/* Genre Grid */}
              <ScrollView style={styles.genreList} showsVerticalScrollIndicator={false}>
                <View style={styles.genreGrid}>
                  {GENRES.map((genre) => (
                    <Pressable
                      key={genre.id}
                      style={[
                        styles.genreChip,
                        selectedGenres.includes(genre.id) && styles.genreChipSelected,
                      ]}
                      onPress={() => toggleGenreSelection(genre.id)}
                    >
                      <Text
                        style={[
                          styles.genreChipText,
                          selectedGenres.includes(genre.id) && styles.genreChipTextSelected,
                        ]}
                      >
                        {genre.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <Pressable style={styles.clearButton} onPress={clearGenreFilters}>
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </Pressable>
                <Pressable style={styles.applyButton} onPress={applyGenreFilters}>
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background.primary,
  },
  headerTitle: {
    color: colors.text.primary,
  },
  filterBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: spacing.sm,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 100,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    color: colors.text.primary,
  },
  genreList: {
    marginBottom: spacing.lg,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.tertiary,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.glass.border,
    marginBottom: spacing.xs,
  },
  genreChipSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
    // Glow effect
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  genreChipText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  genreChipTextSelected: {
    color: colors.text.inverse,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  clearButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: layout.borderRadius.medium,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
  },
  clearButtonText: {
    color: colors.text.secondary,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: layout.borderRadius.medium,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    // Glow effect
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  applyButtonText: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
});

export default HomeScreen;
