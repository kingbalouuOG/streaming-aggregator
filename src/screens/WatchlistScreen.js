/**
 * WatchlistScreen
 * Displays user's watchlist with filtering by status (Want to Watch / Watched)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, typography, spacing, layout } from '../theme';
import GlassContainer from '../components/GlassContainer';
import WatchlistCard from '../components/WatchlistCard';
import EmptyState from '../components/EmptyState';
import { getWatchlist, getWatchlistStats, removeFromWatchlist } from '../storage/watchlist';
import { invalidateRecommendationCache } from '../storage/recommendations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Calculate card width for 2 columns
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 3) / 2;
const ITEM_HEIGHT = CARD_WIDTH * 1.5 + spacing.md; // poster aspect ratio + margin

const WatchlistScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('want_to_watch');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [watchlist, setWatchlist] = useState({ items: [] });
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load watchlist on mount
  useEffect(() => {
    loadWatchlist();
  }, []);

  // Reload when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadWatchlist();
    }, [])
  );

  const loadWatchlist = async () => {
    try {
      setIsLoading(true);
      const [data, statsData] = await Promise.all([
        getWatchlist(),
        getWatchlistStats(),
      ]);
      setWatchlist(data);
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

  const handleCardPress = (item) => {
    navigation.navigate('Detail', {
      itemId: item.id,
      type: item.type,
      isPaidTitle: false,
    });
  };

  const handleRemove = async (item) => {
    try {
      await removeFromWatchlist(item.id, item.type);
      await invalidateRecommendationCache();
      await loadWatchlist();
    } catch (error) {
      console.error('[WatchlistScreen] Error removing item:', error);
    }
  };

  // Filter items by active tab
  const filteredItems = useMemo(() => {
    return watchlist.items.filter((item) => item.status === activeTab);
  }, [watchlist.items, activeTab]);

  // Sort by most recently added
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => b.addedAt - a.addedAt);
  }, [filteredItems]);

  // FlatList optimization
  const getItemLayout = useCallback((data, index) => ({
    length: viewMode === 'grid' ? ITEM_HEIGHT : 110,
    offset: (viewMode === 'grid' ? ITEM_HEIGHT : 110) * index,
    index,
  }), [viewMode]);

  const keyExtractor = useCallback((item) => `${item.type}-${item.id}`, []);

  const renderItem = useCallback(({ item }) => (
    <WatchlistCard
      item={item}
      onPress={handleCardPress}
      onLongPress={handleRemove}
      variant={viewMode}
    />
  ), [viewMode]);

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Tab Selector */}
      <View style={[styles.tabContainer, { backgroundColor: colors.background.tertiary }]}>
        <Pressable
          onPress={() => setActiveTab('want_to_watch')}
          style={[
            styles.tab,
            activeTab === 'want_to_watch' && {
              backgroundColor: colors.accent.primary,
            },
          ]}
        >
          <Ionicons
            name="bookmark"
            size={16}
            color={activeTab === 'want_to_watch' ? '#FFFFFF' : colors.text.secondary}
          />
          <Text
            style={[
              typography.caption,
              {
                color: activeTab === 'want_to_watch' ? '#FFFFFF' : colors.text.secondary,
                fontWeight: activeTab === 'want_to_watch' ? '600' : '400',
              },
            ]}
          >
            Want to Watch ({stats?.wantToWatch || 0})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('watched')}
          style={[
            styles.tab,
            activeTab === 'watched' && {
              backgroundColor: colors.accent.success,
            },
          ]}
        >
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={activeTab === 'watched' ? '#FFFFFF' : colors.text.secondary}
          />
          <Text
            style={[
              typography.caption,
              {
                color: activeTab === 'watched' ? '#FFFFFF' : colors.text.secondary,
                fontWeight: activeTab === 'watched' ? '600' : '400',
              },
            ]}
          >
            Watched ({stats?.watched || 0})
          </Text>
        </Pressable>
      </View>

      {/* View Mode Toggle & Stats */}
      <View style={styles.subHeader}>
        <Text style={[typography.caption, { color: colors.text.secondary }]}>
          {sortedItems.length} {sortedItems.length === 1 ? 'title' : 'titles'}
        </Text>

        <View style={styles.viewModeToggle}>
          <Pressable
            onPress={() => setViewMode('grid')}
            style={[
              styles.viewModeButton,
              viewMode === 'grid' && { backgroundColor: colors.background.tertiary },
            ]}
          >
            <Ionicons
              name="grid"
              size={18}
              color={viewMode === 'grid' ? colors.accent.primary : colors.text.tertiary}
            />
          </Pressable>
          <Pressable
            onPress={() => setViewMode('list')}
            style={[
              styles.viewModeButton,
              viewMode === 'list' && { backgroundColor: colors.background.tertiary },
            ]}
          >
            <Ionicons
              name="list"
              size={18}
              color={viewMode === 'list' ? colors.accent.primary : colors.text.tertiary}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    if (isLoading) return null;

    const isWatchlistEmpty = watchlist.items.length === 0;

    if (isWatchlistEmpty) {
      return (
        <EmptyState
          icon="bookmark-outline"
          title="Your watchlist is empty"
          message="Browse content and add titles you want to watch or have already seen."
          actionLabel="Browse Content"
          onAction={() => navigation.navigate('BrowseTab')}
        />
      );
    }

    return (
      <EmptyState
        icon={activeTab === 'want_to_watch' ? 'bookmark-outline' : 'checkmark-circle-outline'}
        title={
          activeTab === 'want_to_watch'
            ? 'No titles to watch'
            : 'No watched titles'
        }
        message={
          activeTab === 'want_to_watch'
            ? 'Add titles you want to watch from the browse or detail screens.'
            : 'Mark titles as watched to track what you\'ve seen.'
        }
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.screenHeader, { paddingTop: insets.top + spacing.md }]}>
        <Text style={[typography.h2, { color: colors.text.primary }]}>
          My Watchlist
        </Text>
      </View>

      {renderHeader()}

      <FlatList
        data={sortedItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when changing columns
        contentContainerStyle={[
          styles.listContent,
          sortedItems.length === 0 && styles.emptyList,
        ]}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        getItemLayout={getItemLayout}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  viewModeToggle: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  viewModeButton: {
    padding: spacing.sm,
    borderRadius: 8,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  gridRow: {
    justifyContent: 'space-between',
  },
});

export default WatchlistScreen;
