/**
 * RecommendationCard Component
 * Simple card for displaying recommended content
 */

import React, { memo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, typography, layout } from '../theme';
import GlassContainer from './GlassContainer';
import ProgressiveImage from './ProgressiveImage';
import { isInWatchlist, addToWatchlist, removeFromWatchlist } from '../storage/watchlist';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.4;

const RecommendationCard = ({
  item,
  onPress,
  style,
  focusKey = 0,
}) => {
  const { colors } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const {
    id,
    type,
    metadata,
  } = item;

  // State for watchlist/bookmark status
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Check if item is in watchlist on mount and when focusKey changes
  useEffect(() => {
    const checkWatchlistStatus = async () => {
      try {
        const inList = await isInWatchlist(id, type);
        setIsBookmarked(inList);
      } catch (error) {
        console.error('[RecommendationCard] Error checking watchlist status:', error);
      }
    };
    checkWatchlistStatus();
  }, [id, type, focusKey]);

  // Handle bookmark press - toggle add/remove
  const handleBookmarkPress = async (e) => {
    e.stopPropagation();
    try {
      if (isBookmarked) {
        // Remove from watchlist
        await removeFromWatchlist(id, type);
        setIsBookmarked(false);
      } else {
        // Add to watchlist
        const bookmarkMetadata = {
          title: metadata?.title,
          posterPath: metadata?.posterPath,
          genreIds: metadata?.genreIds || [],
          voteAverage: metadata?.voteAverage,
        };
        await addToWatchlist(id, type, bookmarkMetadata, 'want_to_watch');
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('[RecommendationCard] Error toggling watchlist:', error);
    }
  };

  const posterUrl = metadata?.posterPath
    ? `https://image.tmdb.org/t/p/w342${metadata.posterPath}`
    : null;
  const thumbnailUrl = metadata?.posterPath
    ? `https://image.tmdb.org/t/p/w92${metadata.posterPath}`
    : null;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, style]}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <GlassContainer style={styles.card} borderRadius={layout.borderRadius.medium}>
          {/* Poster */}
          {posterUrl ? (
            <ProgressiveImage
              source={{ uri: posterUrl }}
              thumbnailSource={thumbnailUrl ? { uri: thumbnailUrl } : null}
              style={styles.poster}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.poster, styles.placeholderPoster, { backgroundColor: colors.background.tertiary }]}>
              <Ionicons name="film-outline" size={32} color={colors.text.tertiary} />
            </View>
          )}

          {/* Bookmark Icon - Top Left */}
          <Pressable
            onPress={handleBookmarkPress}
            style={styles.bookmarkButton}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <View style={[styles.bookmarkIcon, { backgroundColor: colors.overlay.medium }]}>
              <Ionicons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={18}
                color={isBookmarked ? colors.accent.primary : colors.text.primary}
              />
            </View>
          </Pressable>

          {/* Title Gradient Overlay */}
          <LinearGradient
            colors={['transparent', colors.overlay.heavy]}
            style={styles.gradient}
          >
            <Text
              style={[typography.caption, styles.title, { color: colors.text.primary }]}
              numberOfLines={2}
            >
              {metadata?.title || 'Unknown Title'}
            </Text>
          </LinearGradient>
        </GlassContainer>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginRight: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    position: 'relative',
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    aspectRatio: 2 / 3,
  },
  placeholderPoster: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkButton: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    zIndex: 10,
  },
  bookmarkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  title: {
    fontWeight: '600',
  },
});

export default memo(RecommendationCard, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.type === nextProps.item.type &&
    prevProps.focusKey === nextProps.focusKey
  );
});
