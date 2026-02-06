/**
 * WatchlistCard Component
 * Card for displaying watchlist items with poster, title, and status
 */

import React, { memo } from 'react';
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
import WatchlistStatusBadge from './WatchlistStatusBadge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 3) / 2; // 2 columns with gaps

const WatchlistCard = ({
  item,
  onPress,
  onLongPress,
  variant = 'grid', // 'grid' or 'list'
  style,
}) => {
  const { colors } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const {
    id,
    type,
    status,
    rating,
    metadata,
    addedAt,
  } = item;

  const posterUrl = metadata?.posterPath
    ? `https://image.tmdb.org/t/p/w342${metadata.posterPath}`
    : null;
  const thumbnailUrl = metadata?.posterPath
    ? `https://image.tmdb.org/t/p/w92${metadata.posterPath}`
    : null;

  const releaseYear = metadata?.releaseDate
    ? new Date(metadata.releaseDate).getFullYear()
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

  const getRatingIcon = () => {
    if (status !== 'watched') return null;
    if (rating === 1) return { name: 'thumbs-up', color: colors.accent.success };
    if (rating === -1) return { name: 'thumbs-down', color: colors.accent.error };
    return null;
  };

  const ratingIcon = getRatingIcon();

  if (variant === 'list') {
    return (
      <Pressable
        onPress={() => onPress?.(item)}
        onLongPress={() => onLongPress?.(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.listContainer}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <GlassContainer style={styles.listCard}>
            {/* Poster Thumbnail */}
            <View style={styles.listPosterContainer}>
              {posterUrl ? (
                <ProgressiveImage
                  source={{ uri: posterUrl }}
                  thumbnailSource={thumbnailUrl ? { uri: thumbnailUrl } : null}
                  style={styles.listPoster}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.listPoster, styles.placeholderPoster, { backgroundColor: colors.background.tertiary }]}>
                  <Ionicons name="image-outline" size={24} color={colors.text.tertiary} />
                </View>
              )}
              {/* Status badge on poster */}
              <View style={styles.listStatusBadge}>
                <WatchlistStatusBadge status={status} size="small" />
              </View>
            </View>

            {/* Content */}
            <View style={styles.listContent}>
              <Text
                style={[typography.bodyBold, { color: colors.text.primary }]}
                numberOfLines={2}
              >
                {metadata?.title || 'Unknown Title'}
              </Text>

              <View style={styles.listMeta}>
                {releaseYear && (
                  <Text style={[typography.caption, { color: colors.text.secondary }]}>
                    {releaseYear}
                  </Text>
                )}
                <Text style={[typography.caption, { color: colors.text.tertiary }]}>
                  {type === 'tv' ? 'TV Show' : 'Movie'}
                </Text>
              </View>

              {/* Rating indicator */}
              {ratingIcon && (
                <View style={styles.listRating}>
                  <Ionicons
                    name={ratingIcon.name}
                    size={16}
                    color={ratingIcon.color}
                  />
                  <Text style={[typography.caption, { color: ratingIcon.color }]}>
                    {rating === 1 ? 'Liked' : 'Disliked'}
                  </Text>
                </View>
              )}
            </View>

            {/* Chevron */}
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.text.tertiary}
            />
          </GlassContainer>
        </Animated.View>
      </Pressable>
    );
  }

  // Grid variant (default)
  return (
    <Pressable
      onPress={() => onPress?.(item)}
      onLongPress={() => onLongPress?.(item)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.gridContainer, style]}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <GlassContainer style={styles.gridCard} borderRadius={layout.borderRadius.medium}>
          {/* Poster */}
          {posterUrl ? (
            <ProgressiveImage
              source={{ uri: posterUrl }}
              thumbnailSource={thumbnailUrl ? { uri: thumbnailUrl } : null}
              style={styles.gridPoster}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.gridPoster, styles.placeholderPoster, { backgroundColor: colors.background.tertiary }]}>
              <Ionicons name="image-outline" size={32} color={colors.text.tertiary} />
            </View>
          )}

          {/* Status Badge - Top Left */}
          <View style={styles.gridStatusBadge}>
            <WatchlistStatusBadge status={status} size="small" />
          </View>

          {/* Rating Badge - Top Right */}
          {ratingIcon && (
            <View style={[styles.gridRatingBadge, { backgroundColor: ratingIcon.color }]}>
              <Ionicons name={ratingIcon.name} size={12} color="#FFFFFF" />
            </View>
          )}

          {/* Title Gradient Overlay */}
          <LinearGradient
            colors={['transparent', colors.overlay.heavy]}
            style={styles.gridGradient}
          >
            <Text
              style={[typography.caption, styles.gridTitle, { color: colors.text.primary }]}
              numberOfLines={2}
            >
              {metadata?.title || 'Unknown Title'}
            </Text>
            {releaseYear && (
              <Text style={[typography.metadata, { color: colors.text.secondary }]}>
                {releaseYear}
              </Text>
            )}
          </LinearGradient>
        </GlassContainer>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // Grid Styles
  gridContainer: {
    width: CARD_WIDTH,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gridCard: {
    position: 'relative',
    overflow: 'hidden',
  },
  gridPoster: {
    width: '100%',
    aspectRatio: 2 / 3,
  },
  gridStatusBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  gridRatingBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  gridTitle: {
    fontWeight: '600',
  },

  // List Styles
  listContainer: {
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: layout.borderRadius.medium,
  },
  listPosterContainer: {
    position: 'relative',
  },
  listPoster: {
    width: 60,
    height: 90,
    borderRadius: layout.borderRadius.small,
  },
  listStatusBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.xs,
  },
  listContent: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  listRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },

  // Shared
  placeholderPoster: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default memo(WatchlistCard, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.status === nextProps.item.status &&
    prevProps.item.rating === nextProps.item.rating &&
    prevProps.variant === nextProps.variant
  );
});
