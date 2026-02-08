/**
 * WatchlistScreen
 *
 * Pixel-perfect recreation of web watchlist page
 * Features: Segmented tabs, grid/list views, swipeable cards, progress bar
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { BrowseCard } from '../components/BrowseCard';
import { SwipeableCard } from '../components/SwipeableCard';
import { getWatchlist, getWatchlistStats, removeFromWatchlist, setWatchlistStatus } from '../storage/watchlist';
import { invalidateRecommendationCache } from '../storage/recommendations';
import { ContentItem } from '../types';
import { layout } from '../theme/spacing';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 12;
const HORIZONTAL_PADDING = 20;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;

type WatchlistTab = 'want' | 'watched';
type ViewMode = 'grid' | 'list';

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

interface WatchlistScreenProps {
  navigation: any;
}

const WatchlistScreen: React.FC<WatchlistScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // State
  const [activeTab, setActiveTab] = useState<WatchlistTab>('want');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [watchlistItems, setWatchlistItems] = useState<any[]>([]);
  const [stats, setStats] = useState<{ wantToWatch: number; watched: number; total: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animation for progress bar
  const progressWidth = useSharedValue(0);

  // Load watchlist on mount
  useEffect(() => {
    loadWatchlist();
  }, []);

  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      loadWatchlist();
    }, [])
  );

  // Update progress bar animation
  useEffect(() => {
    if (stats && stats.total > 0) {
      progressWidth.value = withTiming((stats.watched / stats.total) * 100, { duration: 600 });
    }
  }, [stats]);

  const loadWatchlist = async () => {
    try {
      setIsLoading(true);
      const [data, statsData] = await Promise.all([
        getWatchlist(),
        getWatchlistStats(),
      ]);
      setWatchlistItems(data.items || []);
      setStats(statsData);
    } catch (error) {
      console.error('[WatchlistScreen] Error loading watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadWatchlist();
    setIsRefreshing(false);
  };

  // Filter items by tab
  const filteredItems = useMemo(() => {
    const status = activeTab === 'want' ? 'want_to_watch' : 'watched';
    return watchlistItems
      .filter(item => item.status === status)
      .sort((a, b) => b.addedAt - a.addedAt);
  }, [watchlistItems, activeTab]);

  // Map to ContentItem format
  const contentItems: ContentItem[] = useMemo(() => {
    return filteredItems.map(item => ({
      id: String(item.id),
      title: item.metadata?.title || 'Unknown',
      image: item.metadata?.posterPath
        ? `https://image.tmdb.org/t/p/w342${item.metadata.posterPath}`
        : '',
      services: [],
      rating: item.metadata?.voteAverage,
      year: undefined,
      type: item.type as any,
    }));
  }, [filteredItems]);

  // Handlers
  const handleItemPress = (item: ContentItem) => {
    navigation.navigate('Detail', {
      itemId: item.id,
      type: item.type || 'movie',
    });
  };

  const handleRemove = async (id: string) => {
    const item = filteredItems.find(i => String(i.id) === id);
    if (item) {
      try {
        await removeFromWatchlist(item.id, item.type);
        await invalidateRecommendationCache();
        await loadWatchlist();
      } catch (error) {
        console.error('[WatchlistScreen] Error removing item:', error);
      }
    }
  };

  const handleMoveToWatched = async (id: string) => {
    const item = filteredItems.find(i => String(i.id) === id);
    if (item) {
      try {
        await setWatchlistStatus(item.id, item.type, 'watched');
        await invalidateRecommendationCache();
        await loadWatchlist();
      } catch (error) {
        console.error('[WatchlistScreen] Error updating status:', error);
      }
    }
  };

  const handleMoveToWantToWatch = async (id: string) => {
    const item = filteredItems.find(i => String(i.id) === id);
    if (item) {
      try {
        await setWatchlistStatus(item.id, item.type, 'want_to_watch');
        await invalidateRecommendationCache();
        await loadWatchlist();
      } catch (error) {
        console.error('[WatchlistScreen] Error updating status:', error);
      }
    }
  };

  const handleNavigateToBrowse = () => {
    navigation.navigate('Browse');
  };

  // Progress bar animated style
  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Render grid item
  const renderGridItem = ({ item, index }: { item: ContentItem; index: number }) => (
    <View style={[styles.gridItem, { width: CARD_WIDTH }]}>
      <BrowseCard
        item={item}
        index={index}
        onPress={handleItemPress}
        bookmarked={true}
        onToggleBookmark={() => handleRemove(item.id)}
      />
      {activeTab === 'watched' && (
        <View style={styles.watchedOverlay}>
          <View style={[styles.watchedBadge, { backgroundColor: colors.accent.primary }]}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </View>
        </View>
      )}
    </View>
  );

  // Render list item
  const renderListItem = ({ item }: { item: ContentItem }) => (
    <SwipeableCard
      item={item}
      onPress={handleItemPress}
      onDelete={handleRemove}
      onMarkWatched={handleMoveToWatched}
      onMoveToWantToWatch={handleMoveToWantToWatch}
      isWatched={activeTab === 'watched'}
    />
  );

  // Render empty state
  const renderEmpty = () => (
    <Animated.View entering={FadeIn.duration(300)} style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.background.secondary }]}>
        <Ionicons
          name={activeTab === 'want' ? 'bookmark-outline' : 'checkmark-circle-outline'}
          size={28}
          color={colors.text.secondary}
        />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
        {activeTab === 'want' ? 'Nothing here yet' : 'No watched titles'}
      </Text>
      <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
        {activeTab === 'want'
          ? 'Bookmark shows and movies while browsing to save them here'
          : 'Mark titles as watched to track your progress'}
      </Text>
      {activeTab === 'want' && (
        <Pressable
          onPress={handleNavigateToBrowse}
          style={[styles.browseButton, { backgroundColor: colors.accent.primary }]}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.browseButtonText}>Browse Content</Text>
        </Pressable>
      )}
    </Animated.View>
  );

  // Render add card for grid view
  const renderAddCard = () => (
    <Pressable
      onPress={handleNavigateToBrowse}
      style={[
        styles.addCard,
        {
          width: CARD_WIDTH,
          borderColor: colors.text.tertiary,
        },
      ]}
    >
      <View style={[styles.addCardIcon, { backgroundColor: colors.background.secondary }]}>
        <Ionicons name="add" size={20} color={colors.text.secondary} />
      </View>
      <Text style={[styles.addCardText, { color: colors.text.secondary }]}>Add titles</Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>My Watchlist</Text>
      </View>

      {/* Segmented Tab Bar */}
      <View style={styles.tabBarContainer}>
        <View style={[styles.tabBar, { backgroundColor: colors.background.secondary }]}>
          <Pressable
            onPress={() => setActiveTab('want')}
            style={[
              styles.tab,
              activeTab === 'want' && { backgroundColor: colors.accent.primary },
            ]}
          >
            <Ionicons
              name={activeTab === 'want' ? 'bookmark' : 'bookmark-outline'}
              size={14}
              color={activeTab === 'want' ? '#FFFFFF' : colors.text.secondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'want' ? '#FFFFFF' : colors.text.secondary },
              ]}
            >
              Want to Watch ({stats?.wantToWatch || 0})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('watched')}
            style={[
              styles.tab,
              activeTab === 'watched' && { backgroundColor: colors.accent.primary },
            ]}
          >
            <Ionicons
              name={activeTab === 'watched' ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={14}
              color={activeTab === 'watched' ? '#FFFFFF' : colors.text.secondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'watched' ? '#FFFFFF' : colors.text.secondary },
              ]}
            >
              Watched ({stats?.watched || 0})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Count + View Toggle */}
      {contentItems.length > 0 && (
        <View style={styles.subHeader}>
          <Text style={[styles.countText, { color: colors.text.secondary }]}>
            {contentItems.length} title{contentItems.length !== 1 ? 's' : ''}
          </Text>
          <View style={styles.viewToggle}>
            <Pressable
              onPress={() => setViewMode('grid')}
              style={[
                styles.viewButton,
                viewMode === 'grid' && { backgroundColor: colors.background.secondary },
              ]}
            >
              <Ionicons
                name="grid"
                size={16}
                color={viewMode === 'grid' ? colors.text.primary : colors.text.secondary}
              />
            </Pressable>
            <Pressable
              onPress={() => setViewMode('list')}
              style={[
                styles.viewButton,
                viewMode === 'list' && { backgroundColor: colors.background.secondary },
              ]}
            >
              <Ionicons
                name="list"
                size={16}
                color={viewMode === 'list' ? colors.text.primary : colors.text.secondary}
              />
            </Pressable>
          </View>
        </View>
      )}

      {/* Swipe Hint */}
      {contentItems.length > 0 && viewMode === 'list' && (
        <Text style={[styles.swipeHint, { color: colors.text.tertiary }]}>
          Swipe left on a title for quick actions
        </Text>
      )}

      {/* Progress Bar */}
      {stats && stats.total > 0 && stats.watched > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressLabel, { color: colors.text.secondary }]}>
              Watched {stats.watched} of {stats.total}
            </Text>
            <Text style={[styles.progressPercent, { color: colors.accent.primary }]}>
              {Math.round((stats.watched / stats.total) * 100)}%
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.background.secondary }]}>
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: colors.accent.primary },
                progressAnimatedStyle,
              ]}
            />
          </View>
        </View>
      )}

      {/* Content */}
      {viewMode === 'grid' ? (
        <FlatList
          data={contentItems}
          renderItem={renderGridItem}
          keyExtractor={item => `${item.type}-${item.id}`}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={contentItems.length > 0 ? renderAddCard : null}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent.primary}
            />
          }
        />
      ) : (
        <FlatList
          data={contentItems}
          renderItem={renderListItem}
          keyExtractor={item => `${item.type}-${item.id}`}
          contentContainerStyle={styles.listContentList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent.primary}
            />
          }
        />
      )}
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
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  tabBarContainer: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 16,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 12,
  },
  countText: {
    fontSize: 13,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 4,
  },
  viewButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeHint: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressContainer: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 16,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 100,
  },
  listContentList: {
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: GRID_GAP,
  },
  gridItem: {
    position: 'relative',
  },
  watchedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  watchedBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCard: {
    aspectRatio: 3 / 4,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default WatchlistScreen;
