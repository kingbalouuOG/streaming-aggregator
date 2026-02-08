/**
 * BrowseScreen
 *
 * Pixel-perfect recreation of web browse page
 * Features: Search bar, category pills, 2-column grid with BrowseCards
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { BrowseCard } from '../components/BrowseCard';
import FilterModal from '../components/FilterModal';
import { getSelectedPlatforms } from '../storage/userPreferences';
import { discoverMovies, discoverTV, searchMulti } from '../api/tmdb';
import { DEFAULT_REGION } from '../constants/config';
import { ContentItem, FilterState, defaultFilters, ServiceType } from '../types';
import { logError } from '../utils/errorHandler';
import { layout } from '../theme/spacing';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 12;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;

const BROWSE_CATEGORIES = ['All', 'Movies', 'TV'];
const TRENDING_SEARCHES = [
  'Stranger Things',
  'Dune',
  'Cyberpunk',
  'Anime',
  'Documentary',
  'Thriller',
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

interface BrowseScreenProps {
  navigation: any;
}

const BrowseScreen: React.FC<BrowseScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<number[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [error, setError] = useState<Error | null>(null);
  const [focusKey, setFocusKey] = useState(0);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Load platforms and content on mount
  useEffect(() => {
    loadPlatformsAndContent();
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [debounceTimer]);

  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      setFocusKey(prev => prev + 1);
      reloadPlatformsIfNeeded();
    }, []) // Empty deps - only run on focus, not platform changes
  );

  // Reload on category change
  useEffect(() => {
    setCurrentPage(1);
    setHasMorePages(true);
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else {
      loadBrowseContent(1);
    }
  }, [activeCategory]);

  const reloadPlatformsIfNeeded = async () => {
    try {
      const platformIds = await getSelectedPlatforms();
      const changed = JSON.stringify([...platformIds].sort()) !== JSON.stringify([...platforms].sort());
      if (changed && platforms.length > 0) {
        setPlatforms(platformIds);
        setCurrentPage(1);
        setHasMorePages(true);
        loadBrowseContent(1);
      }
    } catch (error) {
      console.error('[BrowseScreen] Error reloading platforms:', error);
    }
  };

  const loadPlatformsAndContent = async () => {
    try {
      const platformIds = await getSelectedPlatforms();
      setPlatforms(platformIds);
      if (platformIds.length > 0) {
        loadBrowseContent(1);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[BrowseScreen] Error loading platforms:', error);
      setIsLoading(false);
    }
  };

  // Load browse content
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

      const allContent: any[] = [];
      const platformsParam = platformIds.join('|');

      // Fetch movies
      if (activeCategory === 'All' || activeCategory === 'Movies') {
        try {
          const response = await discoverMovies({
            watch_region: DEFAULT_REGION,
            with_watch_providers: platformsParam,
            sort_by: 'popularity.desc',
            page,
          });

          if (response.success && response.data?.results) {
            allContent.push(...response.data.results.map((item: any) => ({
              ...item,
              type: 'movie',
            })));
          }
        } catch (e) {
          console.error('[BrowseScreen] Error fetching movies:', e);
        }
      }

      // Fetch TV
      if (activeCategory === 'All' || activeCategory === 'TV') {
        try {
          const response = await discoverTV({
            watch_region: DEFAULT_REGION,
            with_watch_providers: platformsParam,
            sort_by: 'popularity.desc',
            page,
          });

          if (response.success && response.data?.results) {
            allContent.push(...response.data.results.map((item: any) => ({
              ...item,
              type: 'tv',
            })));
          }
        } catch (e) {
          console.error('[BrowseScreen] Error fetching TV:', e);
        }
      }

      const deduped = deduplicateContent(allContent);
      const contentItems = mapToContentItems(deduped);

      if (page === 1) {
        setContent(contentItems);
      } else {
        setContent(prev => [...prev, ...contentItems]);
      }

      setHasMorePages(deduped.length > 0);
    } catch (err) {
      logError(err as Error, 'BrowseScreen loadBrowseContent');
      if (page === 1) setError(err as Error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Search content
  const searchContent = async (query: string, page = 1) => {
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
      const response = await searchMulti(query.trim(), page);

      if (response.success && response.data?.results) {
        let results = response.data.results;

        // Filter by category
        if (activeCategory === 'Movies') {
          results = results.filter((item: any) => item.media_type === 'movie');
        } else if (activeCategory === 'TV') {
          results = results.filter((item: any) => item.media_type === 'tv');
        } else {
          results = results.filter(
            (item: any) => item.media_type === 'movie' || item.media_type === 'tv'
          );
        }

        const contentItems = mapToContentItems(
          results.map((item: any) => ({ ...item, type: item.media_type }))
        );

        if (page === 1) {
          setContent(contentItems);
        } else {
          setContent(prev => [...prev, ...contentItems]);
        }

        setHasMorePages(results.length > 0);
      }
    } catch (err) {
      logError(err as Error, 'BrowseScreen searchContent');
      if (page === 1) setError(err as Error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Map API response to ContentItem
  const mapToContentItems = (items: any[]): ContentItem[] => {
    return items.map(item => ({
      id: String(item.id),
      title: item.title || item.name,
      image: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : '',
      services: [],
      rating: item.vote_average,
      year: parseInt((item.release_date || item.first_air_date || '').split('-')[0]) || undefined,
      type: item.type as any,
      poster_path: item.poster_path,
    }));
  };

  // Deduplicate
  const deduplicateContent = (items: any[]): any[] => {
    const seen = new Map();
    items.forEach(item => {
      const key = `${item.type}-${item.id}`;
      if (!seen.has(key)) seen.set(key, item);
    });
    return Array.from(seen.values()).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  };

  // Debounced search
  const debouncedSearch = (query: string) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      setCurrentPage(1);
      setHasMorePages(true);
      searchContent(query, 1);
    }, 300);
    setDebounceTimer(timer);
  };

  // Handle search change
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      debouncedSearch(text);
    } else {
      if (debounceTimer) clearTimeout(debounceTimer);
      setCurrentPage(1);
      setHasMorePages(true);
      loadBrowseContent(1);
    }
  };

  // Handle search select (trending/recent)
  const handleSearchSelect = (term: string) => {
    setSearchQuery(term);
    setIsSearchFocused(false);
    Keyboard.dismiss();
    if (!recentSearches.includes(term)) {
      setRecentSearches(prev => [term, ...prev].slice(0, 5));
    }
    setCurrentPage(1);
    searchContent(term, 1);
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

  // Handle load more
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

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.services.length > 0) count += filters.services.length;
    if (filters.contentType !== 'All') count++;
    if (filters.cost !== 'All') count++;
    if (filters.genres.length > 0) count += filters.genres.length;
    if (filters.minRating > 0) count++;
    return count;
  }, [filters]);

  // Show search suggestions
  const showSuggestions = isSearchFocused && !searchQuery.trim();

  // Render card
  const renderItem = ({ item, index }: { item: ContentItem; index: number }) => (
    <View style={[styles.cardWrapper, { width: CARD_WIDTH }]}>
      <BrowseCard
        item={item}
        index={index}
        onPress={handleItemSelect}
        bookmarked={bookmarkedIds.has(item.id)}
        onToggleBookmark={handleToggleBookmark}
        userPlatforms={platforms}
        focusKey={focusKey}
      />
    </View>
  );

  // Loading state
  if (isLoading && content.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            {searchQuery.trim() ? 'Searching...' : 'Loading content...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary, paddingTop: insets.top }]}>
      {/* Search & Filter Header */}
      <View style={styles.header}>
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={[styles.searchContainer, { backgroundColor: colors.background.secondary }]}>
            <Ionicons name="search" size={18} color={colors.text.secondary} style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
              placeholder="Search movies and TV shows..."
              placeholderTextColor={colors.text.secondary}
              style={[styles.searchInput, { color: colors.text.primary }]}
              returnKeyType="search"
              onSubmitEditing={() => {
                if (searchQuery.trim()) {
                  if (!recentSearches.includes(searchQuery.trim())) {
                    setRecentSearches(prev => [searchQuery.trim(), ...prev].slice(0, 5));
                  }
                }
              }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => handleSearchChange('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
              </Pressable>
            )}
          </View>

          {/* Filter Button */}
          <Pressable
            onPress={() => setFilterModalVisible(true)}
            style={[
              styles.filterButton,
              {
                backgroundColor: activeFilterCount > 0 ? colors.accent.primary : colors.background.secondary,
              },
            ]}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={activeFilterCount > 0 ? '#FFFFFF' : colors.text.secondary}
            />
            {activeFilterCount > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: colors.background.primary }]}>
                <Text style={[styles.filterBadgeText, { color: colors.accent.primary }]}>
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Category Pills */}
        <View style={styles.categoryRow}>
          {BROWSE_CATEGORIES.map(category => (
            <Pressable
              key={category}
              onPress={() => setActiveCategory(category)}
              style={[
                styles.categoryPill,
                {
                  backgroundColor: category === activeCategory
                    ? colors.accent.primary
                    : colors.background.secondary,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: category === activeCategory ? '#FFFFFF' : colors.text.secondary,
                  },
                ]}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Search Suggestions */}
        {showSuggestions && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={[styles.suggestionsContainer, { backgroundColor: colors.background.secondary }]}
          >
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.suggestionSection}>
                <Text style={[styles.suggestionLabel, { color: colors.text.secondary }]}>RECENT</Text>
                <View style={styles.suggestionTags}>
                  {recentSearches.map(term => (
                    <Pressable
                      key={term}
                      onPress={() => handleSearchSelect(term)}
                      style={[styles.suggestionTag, { backgroundColor: colors.background.tertiary }]}
                    >
                      <Ionicons name="search" size={12} color={colors.text.secondary} />
                      <Text style={[styles.suggestionTagText, { color: colors.text.primary }]}>
                        {term}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Trending */}
            <View style={styles.suggestionSection}>
              <Text style={[styles.suggestionLabel, { color: colors.text.secondary }]}>TRENDING</Text>
              <View style={styles.suggestionTags}>
                {TRENDING_SEARCHES.map((term, i) => (
                  <Pressable
                    key={term}
                    onPress={() => handleSearchSelect(term)}
                    style={[
                      styles.suggestionTag,
                      {
                        backgroundColor: `${colors.accent.primary}15`,
                        borderWidth: 1,
                        borderColor: `${colors.accent.primary}30`,
                      },
                    ]}
                  >
                    <Text style={[styles.trendingNumber, { color: colors.accent.primary }]}>
                      {i + 1}
                    </Text>
                    <Text style={[styles.suggestionTagText, { color: colors.accent.primary }]}>
                      {term}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Content Grid */}
      <FlatList
        data={content}
        renderItem={renderItem}
        keyExtractor={item => `${item.type}-${item.id}`}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={40} color={colors.text.tertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text.secondary }]}>
                No results found
              </Text>
              <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
                Try a different search or filter
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.accent.primary} />
            </View>
          ) : null
        }
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={10}
        removeClippedSubviews
      />

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
  header: {
    zIndex: 20,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 12,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 12,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  suggestionsContainer: {
    marginHorizontal: HORIZONTAL_PADDING,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  suggestionSection: {
    marginBottom: 16,
  },
  suggestionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 10,
  },
  suggestionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  suggestionTagText: {
    fontSize: 12,
  },
  trendingNumber: {
    fontSize: 10,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: GRID_GAP,
  },
  cardWrapper: {
    marginBottom: 0,
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
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    marginTop: 4,
  },
  footerLoader: {
    paddingVertical: 24,
    alignItems: 'center',
  },
});

export default BrowseScreen;
