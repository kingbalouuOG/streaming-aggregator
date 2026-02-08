/**
 * ContentCard Component
 *
 * Pixel-perfect recreation of web ContentCard
 * Displays content poster with service badges, bookmark button, and metadata
 */

import React, { memo, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { ImageSkeleton } from './ImageSkeleton';
import { ServiceBadgeRow } from './ServiceBadge';
import { ContentCardProps, ContentItem, ServiceType } from '../types';
import { layout } from '../theme/spacing';
import { isInWatchlist, addToWatchlist, removeFromWatchlist } from '../storage/watchlist';
import { getCachedServices } from '../utils/serviceCache';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Card sizes matching web design (165x240 default, 200x280 wide)
const CARD_SIZES = {
  default: { width: 165, height: 240 },
  wide: { width: 200, height: 280 },
  compact: { width: 140, height: 200 },
} as const;

// ─────────────────────────────────────────────────────────────
// AnimatedPressable
// ─────────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const ContentCard: React.FC<ContentCardProps> = ({
  item,
  variant = 'default',
  onPress,
  bookmarked: externalBookmarked,
  onToggleBookmark,
  showServices = true,
  showRating = true,
  showYear = true,
  userPlatforms = [],
  focusKey = 0,
}) => {
  const { colors } = useTheme();

  // Get card dimensions based on variant
  const cardSize = CARD_SIZES[variant] || CARD_SIZES.default;

  // State
  const [isBookmarked, setIsBookmarked] = useState(externalBookmarked ?? false);
  const [services, setServices] = useState<ServiceType[]>(item.services || []);
  const [isLoadingServices, setIsLoadingServices] = useState(!item.services);

  // Animation values
  const scale = useSharedValue(1);
  const bookmarkScale = useSharedValue(1);

  // Sync external bookmark state
  useEffect(() => {
    if (externalBookmarked !== undefined) {
      setIsBookmarked(externalBookmarked);
    }
  }, [externalBookmarked]);

  // Check watchlist status on mount
  useEffect(() => {
    if (externalBookmarked === undefined) {
      const checkWatchlist = async () => {
        try {
          const inList = await isInWatchlist(item.id, item.type || 'movie');
          setIsBookmarked(inList);
        } catch (error) {
          console.error('[ContentCard] Error checking watchlist:', error);
        }
      };
      checkWatchlist();
    }
  }, [item.id, item.type, focusKey, externalBookmarked]);

  // Load services if not provided (using cache)
  useEffect(() => {
    if (item.services) {
      setServices(item.services);
      setIsLoadingServices(false);
      return;
    }

    let isMounted = true;
    const fetchServices = async () => {
      try {
        const mediaType = item.type === 'tv' ? 'tv' : 'movie';
        const cachedServices = await getCachedServices(item.id, mediaType, 4);
        if (isMounted) {
          setServices(cachedServices);
        }
      } catch (error) {
        __DEV__ && console.warn('[ContentCard] Error fetching services:', error);
      } finally {
        if (isMounted) setIsLoadingServices(false);
      }
    };

    fetchServices();
    return () => { isMounted = false; };
  }, [item.id, item.type, item.services]);

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bookmarkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkScale.value }],
  }));

  // Handlers
  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handleBookmarkPress = async () => {
    // Pulse animation matching web: [1, 1.3, 0.9, 1.05, 1]
    bookmarkScale.value = withSequence(
      withTiming(1.3, { duration: 100, easing: Easing.out(Easing.ease) }),
      withTiming(0.9, { duration: 80, easing: Easing.inOut(Easing.ease) }),
      withTiming(1.05, { duration: 80, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 140, easing: Easing.out(Easing.ease) })
    );

    const newBookmarkState = !isBookmarked;
    setIsBookmarked(newBookmarkState);

    try {
      const mediaType = item.type || 'movie';
      if (newBookmarkState) {
        await addToWatchlist(item.id, mediaType, {
          title: item.title,
          posterPath: item.image,
          genreIds: [],
          voteAverage: item.rating,
        }, 'want_to_watch');
      } else {
        await removeFromWatchlist(item.id, mediaType);
      }
      onToggleBookmark?.(item);
    } catch (error) {
      console.error('[ContentCard] Error toggling bookmark:', error);
      setIsBookmarked(!newBookmarkState); // Revert on error
    }
  };

  // Build poster URL from item
  const posterUrl = item.image ||
    (item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null);

  return (
    <AnimatedPressable
      onPress={() => onPress?.(item)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { width: cardSize.width, height: cardSize.height },
        cardAnimatedStyle,
      ]}
    >
      {/* Image with skeleton loading */}
      <ImageSkeleton
        source={{ uri: posterUrl || '' }}
        style={styles.image}
        borderRadius={12}
        resizeMode="cover"
      />

      {/* Gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.9)']}
        locations={[0, 0.4, 1]}
        style={styles.gradient}
      />

      {/* Service badges - top left */}
      {showServices && services.length > 0 && (
        <View style={styles.servicesContainer}>
          <ServiceBadgeRow services={services} size="md" maxDisplay={3} />
        </View>
      )}

      {/* Bookmark button - top right */}
      {onToggleBookmark && (
        <Animated.View style={[styles.bookmarkButton, bookmarkAnimatedStyle]}>
          <Pressable
            onPress={handleBookmarkPress}
            style={[
              styles.bookmarkInner,
              {
                backgroundColor: isBookmarked
                  ? colors.accent.primary
                  : 'rgba(0,0,0,0.4)',
              },
            ]}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={14}
              color={isBookmarked ? '#FFFFFF' : 'rgba(255,255,255,0.7)'}
            />
          </Pressable>
        </Animated.View>
      )}

      {/* Content - bottom */}
      <View style={styles.content}>
        {/* Rating */}
        {showRating && item.rating && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={11} color="#FACC15" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        )}

        {/* Title */}
        <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Year */}
        {showYear && item.year && (
          <Text style={styles.year}>{item.year}</Text>
        )}
      </View>
    </AnimatedPressable>
  );
};

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#161620',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  servicesContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 4,
  },
  bookmarkButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  bookmarkInner: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
  year: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
});

// ─────────────────────────────────────────────────────────────
// Memoized Export
// ─────────────────────────────────────────────────────────────

export default memo(ContentCard, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.image === nextProps.item.image &&
    prevProps.bookmarked === nextProps.bookmarked &&
    prevProps.variant === nextProps.variant &&
    prevProps.focusKey === nextProps.focusKey
  );
});
