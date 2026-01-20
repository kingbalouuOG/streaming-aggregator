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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, layout } from '../theme';
import { getSelectedPlatforms } from '../storage/userPreferences';
import { discoverMovies, discoverTV } from '../api/tmdb';
import ContentCard from '../components/ContentCard';
import FilterChip from '../components/FilterChip';
import GlassContainer from '../components/GlassContainer';

const FILTERS = {
  ALL: 'all',
  MOVIES: 'movies',
  TV: 'tv',
  DOCUMENTARIES: 'documentaries',
};

const DOCUMENTARY_GENRE_ID = 99;

const HomeScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState(FILTERS.ALL);
  const [platforms, setPlatforms] = useState([]);
  const [popularContent, setPopularContent] = useState([]);
  const [recentContent, setRecentContent] = useState([]);
  const [actionContent, setActionContent] = useState([]);
  const [comedyContent, setComedyContent] = useState([]);
  const [dramaContent, setDramaContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    // Reload content when filter changes
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

      for (const platformId of platformIds) {
        // Fetch based on filter
        if (shouldFetchMovies()) {
          const moviesResponse = await discoverMovies({
            watch_region: 'GB',
            with_watch_providers: platformId,
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

      for (const platformId of platformIds) {
        if (shouldFetchMovies()) {
          const moviesResponse = await discoverMovies({
            watch_region: 'GB',
            with_watch_providers: platformId,
            sort_by: 'release_date.desc',
            'release_date.lte': new Date().toISOString().split('T')[0],
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
            sort_by: 'first_air_date.desc',
            'first_air_date.lte': new Date().toISOString().split('T')[0],
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
      setRecentContent(merged.slice(0, 20));
    } catch (error) {
      console.error('[HomeScreen] Error fetching recent content:', error);
    }
  };

  // Fetch content by genre
  const fetchGenreContent = async (platformIds, genreId, setter) => {
    try {
      const allContent = [];

      for (const platformId of platformIds) {
        if (shouldFetchMovies()) {
          const moviesResponse = await discoverMovies({
            watch_region: 'GB',
            with_watch_providers: platformId,
            with_genres: genreId,
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
            with_genres: genreId,
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
        <GlassContainer style={styles.header} borderRadius={0}>
          <View style={styles.headerContent}>
            <Text style={[typography.h2, styles.headerTitle]}>StreamFinder</Text>
            <Pressable style={styles.filterIcon}>
              <Ionicons name="options-outline" size={24} color={colors.text.primary} />
            </Pressable>
          </View>
        </GlassContainer>

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
        </ScrollView>

        {/* Content Sections */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {renderContentSection('Popular on Your Services', popularContent)}
          {renderContentSection('Recently Added', recentContent)}
          {renderContentSection('Action', actionContent)}
          {renderContentSection('Comedy', comedyContent)}
          {renderContentSection('Drama', dramaContent)}
        </ScrollView>
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
  },
  filterIcon: {
    padding: spacing.sm,
  },
  filterBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
