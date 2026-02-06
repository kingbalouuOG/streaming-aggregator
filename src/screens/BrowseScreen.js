import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, layout } from '../theme';
import { getSelectedPlatforms } from '../storage/userPreferences';
import { discoverMovies, discoverTV, searchMulti } from '../api/tmdb';
import { DEFAULT_REGION } from '../constants/config';
import ContentCard from '../components/ContentCard';
import FilterChip from '../components/FilterChip';
import SearchBar from '../components/SearchBar';
import ErrorMessage from '../components/ErrorMessage';
import { logError } from '../utils/errorHandler';
import { addToWatchlist } from '../storage/watchlist';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Card sizing for FlatList optimization
const CARD_MARGIN = 12; // spacing.md
const getCardHeight = (cardWidth) => cardWidth * 1.5 + CARD_MARGIN * 2; // 2:3 aspect ratio + margins

const FILTERS = {
  ALL: 'all',
  MOVIES: 'movies',
  TV: 'tv',
};

const BrowseScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(FILTERS.ALL);
  const [platforms, setPlatforms] = useState([]);
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [error, setError] = useState(null);
  // Focus key to trigger watchlist status refresh in child cards
  const [focusKey, setFocusKey] = useState(0);

  useEffect(() => {
    loadPlatformsAndContent();
  }, []);

  // Cleanup debounce timer on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

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
            console.log('[BrowseScreen] Platforms changed, reloading content');
            setPlatforms(platformIds);
            setCurrentPage(1);
            setHasMorePages(true);
            if (searchQuery.trim()) {
              searchContent(searchQuery, 1);
            } else {
              loadBrowseContent(1);
            }
          }
        } catch (error) {
          console.error('[BrowseScreen] Error reloading platforms:', error);
        }
      };

      reloadPlatforms();
    }, [platforms, searchQuery])
  );

  useEffect(() => {
    // Reset and reload when filter changes
    setCurrentPage(1);
    setHasMorePages(true);
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else {
      loadBrowseContent(1);
    }
  }, [selectedFilter]);

  // Load user's platforms and initial content
  const loadPlatformsAndContent = async () => {
    try {
      const platformIds = await getSelectedPlatforms();
      setPlatforms(platformIds);

      if (platformIds.length > 0) {
        loadBrowseContent(1);
      }
    } catch (error) {
      console.error('[BrowseScreen] Error loading platforms:', error);
    }
  };

  // Load browse content (discover API)
  const loadBrowseContent = async (page = 1) => {
    if (page === 1) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const platformIds = await getSelectedPlatforms();
      if (platformIds.length === 0) {
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      const allContent = [];

      // Query all platforms at once using | (OR) operator
      const platformsParam = platformIds.join('|');

      // Fetch based on filter
      if (selectedFilter === FILTERS.ALL || selectedFilter === FILTERS.MOVIES) {
        const moviesResponse = await discoverMovies({
          watch_region: DEFAULT_REGION,
          with_watch_providers: platformsParam,
          sort_by: 'popularity.desc',
          page,
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

      if (selectedFilter === FILTERS.ALL || selectedFilter === FILTERS.TV) {
        const tvResponse = await discoverTV({
          watch_region: DEFAULT_REGION,
          with_watch_providers: platformsParam,
          sort_by: 'popularity.desc',
          page,
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

      // Deduplicate content
      const deduped = deduplicateContent(allContent);

      if (page === 1) {
        setContent(deduped);
      } else {
        setContent((prev) => [...prev, ...deduped]);
      }

      setHasMorePages(deduped.length > 0);
    } catch (err) {
      logError(err, 'BrowseScreen loadBrowseContent');
      if (page === 1) {
        setError(err);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Search content
  const searchContent = async (query, page = 1) => {
    if (!query.trim()) {
      loadBrowseContent(1);
      return;
    }

    if (page === 1) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const platformIds = await getSelectedPlatforms();
      if (platformIds.length === 0) {
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      const searchResponse = await searchMulti(query.trim(), page);

      if (searchResponse.success && searchResponse.data.results) {
        let results = searchResponse.data.results;

        // Filter by content type
        if (selectedFilter === FILTERS.MOVIES) {
          results = results.filter((item) => item.media_type === 'movie');
        } else if (selectedFilter === FILTERS.TV) {
          results = results.filter((item) => item.media_type === 'tv');
        } else {
          // ALL - exclude persons
          results = results.filter(
            (item) => item.media_type === 'movie' || item.media_type === 'tv'
          );
        }

        // Add type field - platforms will be lazy-loaded by ContentCard
        const enrichedResults = results.map((item) => ({
          ...item,
          type: item.media_type,
          platforms: null, // Will be lazy-loaded by ContentCard
        }));

        if (page === 1) {
          setContent(enrichedResults);
        } else {
          setContent((prev) => [...prev, ...enrichedResults]);
        }

        setHasMorePages(enrichedResults.length > 0);
      }
    } catch (err) {
      logError(err, 'BrowseScreen searchContent');
      if (page === 1) {
        setError(err);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Debounced search handler
  const debouncedSearch = (query) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      setCurrentPage(1);
      setHasMorePages(true);
      searchContent(query, 1);
    }, 300);

    setDebounceTimer(timer);
  };

  // Handle search input change
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (text.trim()) {
      debouncedSearch(text);
    } else {
      // Clear search, show browse content
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      setCurrentPage(1);
      setHasMorePages(true);
      loadBrowseContent(1);
    }
  };

  // Handle search clear
  const handleSearchClear = () => {
    setSearchQuery('');
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    setCurrentPage(1);
    setHasMorePages(true);
    loadBrowseContent(1);
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

  // Handle content card press
  const handleCardPress = (item) => {
    navigation.navigate('Detail', {
      itemId: item.id,
      type: item.type,
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
      console.error('[BrowseScreen] Error adding to watchlist:', error);
    }
  };

  // Handle load more (pagination)
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMorePages && content.length > 0) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);

      if (searchQuery.trim()) {
        searchContent(searchQuery, nextPage);
      } else {
        loadBrowseContent(nextPage);
      }
    }
  };

  // Calculate card width for 2-column grid
  const cardWidth = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
  const cardHeight = getCardHeight(cardWidth);

  // Memoized getItemLayout for FlatList optimization
  const getItemLayout = useMemo(() => (data, index) => ({
    length: cardHeight,
    offset: cardHeight * Math.floor(index / 2),
    index,
  }), [cardHeight]);

  // Render content card
  const renderItem = ({ item, index }) => {
    const isLeftColumn = index % 2 === 0;
    return (
      <View
        style={[
          styles.cardWrapper,
          { width: cardWidth },
          !isLeftColumn && { marginLeft: spacing.md },
        ]}
      >
        <ContentCard
          item={item}
          onPress={handleCardPress}
          onBookmarkPress={handleBookmarkPress}
          userPlatforms={platforms}
          focusKey={focusKey}
        />
      </View>
    );
  };

  // Render footer (loading more indicator)
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.accent.primary} />
      </View>
    );
  };

  // Render empty state
  const renderEmpty = () => {
    if (isLoading) return null;

    // Show error if present
    if (error) {
      return (
        <ErrorMessage
          error={error}
          onRetry={() => searchQuery.trim() ? searchContent(searchQuery, 1) : loadBrowseContent(1)}
        />
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={[typography.h3, styles.emptyTitle]}>
          {searchQuery.trim() ? 'No results found' : 'No content available'}
        </Text>
        <Text style={[typography.body, styles.emptyText]}>
          {searchQuery.trim()
            ? 'Try a different search term'
            : 'Select platforms in your profile to see content'}
        </Text>
      </View>
    );
  };

  // Loading state
  if (isLoading && content.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={[typography.body, styles.loadingText]}>
            {searchQuery.trim() ? 'Searching...' : 'Loading content...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearchChange}
            onClear={handleSearchClear}
            placeholder="Search movies and TV shows..."
          />
        </View>

        {/* Filter Chips */}
        <View style={styles.filterSection}>
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
        </View>

        {/* Content Grid */}
        <FlatList
          data={content}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          // Performance optimizations
          getItemLayout={getItemLayout}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={10}
          removeClippedSubviews={true}
        />
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
  searchSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  row: {
    marginBottom: spacing.md,
  },
  cardWrapper: {
    marginBottom: spacing.md,
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
    paddingTop: spacing.xxxl,
  },
  emptyTitle: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});

export default BrowseScreen;
