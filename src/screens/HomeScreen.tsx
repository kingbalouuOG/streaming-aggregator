/**
 * HomeScreen
 *
 * Pixel-perfect recreation of the web home tab
 * Features: FeaturedHero with parallax, CategoryFilter, ContentRows
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  InteractionManager,
  ListRenderItemInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { FeaturedHero } from '../components/FeaturedHero';
import { CategoryFilter } from '../components/CategoryFilter';
import { ContentRow } from '../components/ContentRow';
import { ContentCard } from '../components/ContentCard';
import FilterModal from '../components/FilterModal';
import ErrorMessage from '../components/ErrorMessage';
import { getSelectedPlatforms, getHomeGenres } from '../storage/userPreferences';
import { GENRE_NAMES } from '../constants/genres';
import { discoverMovies, discoverTV, getContentWatchProviders } from '../api/tmdb';
import { maintainCache } from '../api/cache';
import { mapProviderIdToCanonical, normalizePlatformName, mapRentBuyToSubscription } from '../constants/platforms';
import { DEFAULT_REGION, SPECIAL_GENRE_IDS, CACHE_CONFIG } from '../constants/config';
import { ContentItem, ServiceType, FilterState, categories, defaultFilters } from '../types';
import { logError } from '../utils/errorHandler';
import { layout } from '../theme/spacing';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DOCUMENTARY_GENRE_ID = SPECIAL_GENRE_IDS.DOCUMENTARY;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Scroll position for parallax
  const scrollY = useSharedValue(0);

  // State
  const [activeCategory, setActiveCategory] = useState('All');
  const [platforms, setPlatforms] = useState<number[]>([]);
  const [popularContent, setPopularContent] = useState<ContentItem[]>([]);
  const [highestRatedContent, setHighestRatedContent] = useState<ContentItem[]>([]);
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [homeGenres, setHomeGenres] = useState<number[]>([]);
  const [genreSections, setGenreSections] = useState<Record<number, { data: ContentItem[] }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [error, setError] = useState<Error | null>(null);
  const [focusKey, setFocusKey] = useState(0);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Featured content for hero
  const featuredItem = useMemo(() => {
    if (popularContent.length > 0) {
      const item = popularContent[0];
      return {
        id: item.id,
        title: item.title,
        image: item.image || (item.poster_path ? `https://image.tmdb.org/t/p/w780${item.poster_path}` : ''),
        services: item.services || [],
        rating: item.rating,
        year: item.year,
        type: item.type,
      };
    }
    return null;
  }, [popularContent]);

  // Scroll handler for parallax
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Load content on mount
  useEffect(() => {
    // Defer cache maintenance until after initial render
    const task = InteractionManager.runAfterInteractions(() => {
      maintainCache(CACHE_CONFIG.MAX_ENTRIES).catch(err =>
        __DEV__ && console.warn('[HomeScreen] Cache maintenance failed:', err)
      );
    });
    loadContent();
    return () => task.cancel();
  }, []);

  // Reload when screen gains focus
  useFocusEffect(
    useCallback(() => {
      setFocusKey(prev => prev + 1);
      reloadPlatformsIfNeeded();
    }, []) // Empty deps - only run on focus, not platform changes
  );

  // Reload content when category changes
  useEffect(() => {
    if (platforms.length > 0) {
      loadContent();
    }
  }, [activeCategory, filters]);

  const reloadPlatformsIfNeeded = async () => {
    try {
      const platformIds = await getSelectedPlatforms();
      const changed = JSON.stringify([...platformIds].sort()) !== JSON.stringify([...platforms].sort());
      if (changed && platforms.length > 0) {
        setPlatforms(platformIds);
        loadContent();
      }
    } catch (error) {
      console.error('[HomeScreen] Error reloading platforms:', error);
    }
  };

  // Map category to content type filter
  const getContentTypeFromCategory = (category: string): string => {
    switch (category) {
      case 'Movies': return 'movies';
      case 'TV Shows': return 'tv';
      case 'Docs': return 'documentaries';
      case 'Anime': return 'anime';
      default: return 'all';
    }
  };

  // Load all content
  const loadContent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const platformIds = await getSelectedPlatforms();
      setPlatforms(platformIds);

      if (platformIds.length === 0) {
        setIsLoading(false);
        return;
      }

      const userGenres = await getHomeGenres();
      setHomeGenres(userGenres);

      const exclusionSet = new Set<string>();
      const contentType = getContentTypeFromCategory(activeCategory);

      // Fetch all sections with deduplication
      const popular = await fetchContent(platformIds, 'popular', exclusionSet, contentType);
      popular.forEach((item: any) => exclusionSet.add(`${item.type}-${item.id}`));
      setPopularContent(mapToContentItems(popular));

      const highestRated = await fetchContent(platformIds, 'rating', exclusionSet, contentType);
      highestRated.forEach((item: any) => exclusionSet.add(`${item.type}-${item.id}`));
      setHighestRatedContent(mapToContentItems(highestRated));

      const recent = await fetchContent(platformIds, 'recent', exclusionSet, contentType);
      recent.forEach((item: any) => exclusionSet.add(`${item.type}-${item.id}`));
      setRecentContent(mapToContentItems(recent));

      // Genre sections
      const newGenreSections: Record<number, { data: ContentItem[] }> = {};
      for (const genreId of userGenres.slice(0, 3)) {
        const genreContent = await fetchGenreContent(platformIds, genreId, exclusionSet, contentType);
        genreContent.forEach((item: any) => exclusionSet.add(`${item.type}-${item.id}`));
        newGenreSections[genreId] = { data: mapToContentItems(genreContent) };
      }
      setGenreSections(newGenreSections);

    } catch (err) {
      logError(err as Error, 'HomeScreen loadContent');
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Map API response to ContentItem
  const mapToContentItems = (items: any[]): ContentItem[] => {
    return items.map(item => ({
      id: String(item.id),
      title: item.title || item.name,
      image: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : '',
      services: item.services || [],
      rating: item.vote_average,
      year: parseInt((item.release_date || item.first_air_date || '').split('-')[0]) || undefined,
      type: item.type as any,
      poster_path: item.poster_path,
    }));
  };

  // Generic content fetcher
  const fetchContent = async (
    platformIds: number[],
    sortType: 'popular' | 'rating' | 'recent',
    exclusionSet: Set<string>,
    contentType: string
  ): Promise<any[]> => {
    const allContent: any[] = [];
    const platformsParam = platformIds.join('|');

    const sortBy = {
      popular: 'popularity.desc',
      rating: 'vote_average.desc',
      recent: 'release_date.desc',
    }[sortType];

    const extraParams = sortType === 'rating' ? { 'vote_count.gte': 100 } : {};

    // Fetch movies
    if (contentType === 'all' || contentType === 'movies' || contentType === 'documentaries') {
      try {
        const response = await discoverMovies({
          watch_region: DEFAULT_REGION,
          with_watch_providers: platformsParam,
          sort_by: sortBy,
          page: 1,
          ...(contentType === 'documentaries' ? { with_genres: DOCUMENTARY_GENRE_ID } : {}),
          ...extraParams,
        });

        if (response.success && response.data?.results) {
          allContent.push(...response.data.results.map((item: any) => ({
            ...item,
            type: 'movie',
          })));
        }
      } catch (e) {
        console.error('[HomeScreen] Error fetching movies:', e);
      }
    }

    // Fetch TV
    if (contentType === 'all' || contentType === 'tv') {
      try {
        const response = await discoverTV({
          watch_region: DEFAULT_REGION,
          with_watch_providers: platformsParam,
          sort_by: sortType === 'recent' ? 'first_air_date.desc' : sortBy,
          page: 1,
          ...extraParams,
        });

        if (response.success && response.data?.results) {
          allContent.push(...response.data.results.map((item: any) => ({
            ...item,
            type: 'tv',
          })));
        }
      } catch (e) {
        console.error('[HomeScreen] Error fetching TV:', e);
      }
    }

    // Deduplicate and filter
    const deduped = deduplicateContent(allContent);
    return deduped.filter(item => !exclusionSet.has(`${item.type}-${item.id}`)).slice(0, 20);
  };

  // Fetch genre-specific content
  const fetchGenreContent = async (
    platformIds: number[],
    genreId: number,
    exclusionSet: Set<string>,
    contentType: string
  ): Promise<any[]> => {
    const allContent: any[] = [];
    const platformsParam = platformIds.join('|');

    if (contentType === 'all' || contentType === 'movies') {
      try {
        const response = await discoverMovies({
          watch_region: DEFAULT_REGION,
          with_watch_providers: platformsParam,
          with_genres: genreId.toString(),
          sort_by: 'popularity.desc',
          page: 1,
        });

        if (response.success && response.data?.results) {
          allContent.push(...response.data.results.map((item: any) => ({
            ...item,
            type: 'movie',
          })));
        }
      } catch (e) {
        console.error(`[HomeScreen] Error fetching genre ${genreId} movies:`, e);
      }
    }

    if (contentType === 'all' || contentType === 'tv') {
      try {
        const response = await discoverTV({
          watch_region: DEFAULT_REGION,
          with_watch_providers: platformsParam,
          with_genres: genreId.toString(),
          sort_by: 'popularity.desc',
          page: 1,
        });

        if (response.success && response.data?.results) {
          allContent.push(...response.data.results.map((item: any) => ({
            ...item,
            type: 'tv',
          })));
        }
      } catch (e) {
        console.error(`[HomeScreen] Error fetching genre ${genreId} TV:`, e);
      }
    }

    const deduped = deduplicateContent(allContent);
    return deduped.filter(item => !exclusionSet.has(`${item.type}-${item.id}`)).slice(0, 20);
  };

  // Deduplicate by type-id
  const deduplicateContent = (items: any[]): any[] => {
    const seen = new Map();
    items.forEach(item => {
      const key = `${item.type}-${item.id}`;
      if (!seen.has(key)) seen.set(key, item);
    });
    return Array.from(seen.values()).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  };

  // Handle pull to refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadContent();
    setIsRefreshing(false);
  };

  // Handle item press
  const handleItemSelect = (item: ContentItem) => {
    navigation.navigate('Detail', {
      itemId: item.id,
      type: item.type || 'movie',
    });
  };

  // Handle bookmark toggle
  const handleToggleBookmark = (item: ContentItem) => {
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  };

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.services.length > 0) count += filters.services.length;
    if (filters.contentType !== 'All') count++;
    if (filters.cost !== 'All') count++;
    if (filters.genres.length > 0) count += filters.genres.length;
    if (filters.minRating > 0) count++;
    return count;
  }, [filters]);

  // Memoized handler refs to prevent re-renders
  const handleItemSelectRef = useRef(handleItemSelect);
  handleItemSelectRef.current = handleItemSelect;

  const handleToggleBookmarkRef = useRef(handleToggleBookmark);
  handleToggleBookmarkRef.current = handleToggleBookmark;

  // Memoized renderItem for default cards
  const renderDefaultCard = useCallback(({ item }: ListRenderItemInfo<ContentItem>) => (
    <ContentCard
      item={item}
      onPress={handleItemSelectRef.current}
      onToggleBookmark={handleToggleBookmarkRef.current}
      variant="default"
    />
  ), []);

  // Memoized renderItem for wide cards
  const renderWideCard = useCallback(({ item }: ListRenderItemInfo<ContentItem>) => (
    <ContentCard
      item={item}
      onPress={handleItemSelectRef.current}
      onToggleBookmark={handleToggleBookmarkRef.current}
      variant="wide"
    />
  ), []);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading content...
          </Text>
        </View>
      </View>
    );
  }

  // No platforms
  if (platforms.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            No Platforms Selected
          </Text>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            Please select streaming platforms in your profile
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && !isLoading && popularContent.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <ErrorMessage error={error} onRetry={loadContent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
            progressBackgroundColor={colors.background.secondary}
          />
        }
      >
        {/* Featured Hero */}
        {featuredItem && (
          <FeaturedHero
            title={featuredItem.title}
            subtitle={featuredItem.type === 'tv' ? 'Popular Series' : 'Popular Movie'}
            image={featuredItem.image}
            services={featuredItem.services}
            tags={[
              featuredItem.type === 'tv' ? 'TV Series' : 'Movie',
              featuredItem.year?.toString() || '',
              featuredItem.rating ? `${featuredItem.rating.toFixed(1)} Rating` : '',
            ].filter(Boolean)}
            bookmarked={bookmarkedIds.has(featuredItem.id)}
            onToggleBookmark={() => handleToggleBookmark(featuredItem as ContentItem)}
            scrollY={scrollY}
          />
        )}

        {/* Category Filter */}
        <CategoryFilter
          categories={[...categories]}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onFilterPress={() => setFilterModalVisible(true)}
          hasActiveFilters={activeFilterCount > 0}
        />

        {/* Content Rows */}
        <View style={styles.contentSection}>
          {/* Popular */}
          {popularContent.length > 0 && (
            <ContentRow
              title="Popular on Your Services"
              items={popularContent.slice(1)} // Skip first item (shown in hero)
              onItemSelect={handleItemSelect}
              renderItem={renderDefaultCard}
            />
          )}

          {/* Highest Rated */}
          {highestRatedContent.length > 0 && (
            <ContentRow
              title="Highest Rated"
              items={highestRatedContent}
              onItemSelect={handleItemSelect}
              variant="wide"
              renderItem={renderWideCard}
            />
          )}

          {/* Recently Added */}
          {recentContent.length > 0 && (
            <ContentRow
              title="Recently Added"
              items={recentContent}
              onItemSelect={handleItemSelect}
              renderItem={renderDefaultCard}
            />
          )}

          {/* Genre Sections */}
          {homeGenres.slice(0, 3).map(genreId => {
            const section = genreSections[genreId];
            if (!section || section.data.length === 0) return null;

            return (
              <ContentRow
                key={`genre-${genreId}`}
                title={GENRE_NAMES[genreId] || `Genre ${genreId}`}
                items={section.data}
                onItemSelect={handleItemSelect}
                renderItem={renderDefaultCard}
              />
            );
          })}
        </View>
      </Animated.ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        onApply={(newFilters: any) => setFilters(newFilters)}
        onClear={() => setFilters(defaultFilters)}
        userPlatforms={platforms}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  contentSection: {
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
});

export default HomeScreen;
