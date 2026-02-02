/**
 * ContentCard Component
 * Displays content poster with multi-platform badges and title overlay
 * Lazy-loads actual platform availability data from TMDb API
 */

import React, { memo, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, colors, typography, spacing, layout } from '../theme';
import GlassContainer from './GlassContainer';
import ProgressiveImage from './ProgressiveImage';
import { getContentWatchProviders } from '../api/tmdb';

// Platform logo mapping - all platforms
const PLATFORM_LOGOS = {
  8: require('../../assets/platform-logos/Netflix-logo.png'),
  9: require('../../assets/platform-logos/Amazon-Prime-logo.png'),
  350: require('../../assets/platform-logos/Apple-TV-logo.png'),
  337: require('../../assets/platform-logos/Disney_plus_logo.png'),
  39: require('../../assets/platform-logos/now-tv-logo.png'),
  38: require('../../assets/platform-logos/bbc-iplayer-logo.png'),
  54: require('../../assets/platform-logos/itvx-logo.png'),
  103: require('../../assets/platform-logos/channel4-logo.png'),
  582: require('../../assets/platform-logos/paramount-logo.png'),
  29: require('../../assets/platform-logos/skygo-logo.png'),
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.4; // 40% of screen width

const ContentCard = ({ item, onPress, userPlatforms = [] }) => {
  const { colors } = useTheme();
  const {
    id,
    title,
    name,
    poster_path,
    type = 'movie', // 'movie' or 'tv'
    platforms: initialPlatforms = null,
  } = item;

  // State for lazy-loaded platform data
  const [platforms, setPlatforms] = useState(initialPlatforms);
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(initialPlatforms === null);

  const displayTitle = title || name;
  const posterUrl = poster_path
    ? `https://image.tmdb.org/t/p/w342${poster_path}`
    : null;
  const thumbnailUrl = poster_path
    ? `https://image.tmdb.org/t/p/w92${poster_path}`
    : null;

  // Lazy-load platform data when component mounts
  useEffect(() => {
    // Skip if platforms already loaded
    if (initialPlatforms !== null) {
      setPlatforms(initialPlatforms);
      setIsLoadingPlatforms(false);
      return;
    }

    let isMounted = true;

    const fetchPlatforms = async () => {
      try {
        const mediaType = type === 'tv' ? 'tv' : 'movie';
        const response = await getContentWatchProviders(id, mediaType);

        if (!isMounted) return;

        if (response.success && response.data) {
          // Get flatrate (subscription) providers and filter to user's platforms
          const flatrateProviders = response.data.flatrate || [];
          const userPlatformIds = userPlatforms.map(p => typeof p === 'object' ? p.id : p);

          // Filter to only show platforms the user has selected
          const matchingPlatforms = flatrateProviders.filter(provider =>
            userPlatformIds.includes(provider.provider_id)
          ).map(provider => ({
            id: provider.provider_id,
            name: provider.provider_name,
          }));

          setPlatforms(matchingPlatforms);
        } else {
          setPlatforms([]);
        }
      } catch (error) {
        console.error('Error fetching platform data:', error);
        if (isMounted) {
          setPlatforms([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPlatforms(false);
        }
      }
    };

    fetchPlatforms();

    return () => {
      isMounted = false;
    };
  }, [id, type, initialPlatforms, userPlatforms]);

  // Platform badge logic: show max 3, then "+N" for additional
  const displayPlatforms = platforms || [];
  const visiblePlatforms = displayPlatforms.slice(0, 3);
  const remainingCount = displayPlatforms.length > 3 ? displayPlatforms.length - 3 : 0;

  // Animation state
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      onPress={() => onPress && onPress(item)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.container}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }}
      >
      <GlassContainer
        style={styles.card}
        borderRadius={layout.borderRadius.medium}
      >
        {/* Poster Image */}
        {posterUrl ? (
          <ProgressiveImage
            source={{ uri: posterUrl }}
            thumbnailSource={thumbnailUrl ? { uri: thumbnailUrl } : null}
            style={styles.poster}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.poster, styles.placeholderPoster]}>
            <Text style={typography.caption}>No Image</Text>
          </View>
        )}

        {/* Platform Badges - Top Right */}
        {isLoadingPlatforms ? (
          <View style={styles.badgesContainer}>
            <View style={styles.badge}>
              <ActivityIndicator size="small" color={colors.text.primary} />
            </View>
          </View>
        ) : displayPlatforms.length > 0 && (
          <View style={styles.badgesContainer}>
            {visiblePlatforms.map((platform, index) => {
              const hasLogo = PLATFORM_LOGOS[platform.id];
              return (
                <View
                  key={`${platform.id}-${index}`}
                  style={[
                    styles.badge,
                    index > 0 && { marginLeft: -spacing.sm },
                  ]}
                >
                  {hasLogo ? (
                    <Image
                      source={PLATFORM_LOGOS[platform.id]}
                      style={styles.badgeLogo}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.badgeInner}>
                      <Text style={styles.badgeText}>
                        {platform.name?.charAt(0) || '?'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
            {remainingCount > 0 && (
              <View style={[styles.badge, { marginLeft: -spacing.sm }]}>
                <View style={styles.badgeInner}>
                  <Text style={styles.badgeText}>+{remainingCount}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Title Overlay - Bottom with Gradient */}
        <LinearGradient
          colors={['transparent', colors.overlay.heavy]}
          style={styles.titleGradient}
        >
          <Text
            style={[typography.caption, styles.title]}
            numberOfLines={2}
          >
            {displayTitle}
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
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, // Android shadow
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
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgesContainer: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.overlay.medium,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  badgeLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  badgeInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.primary,
  },
  titleGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  title: {
    color: colors.text.primary,
    fontWeight: '600',
  },
});

// Memoize component to prevent unnecessary re-renders
export default memo(ContentCard, (prevProps, nextProps) => {
  // Compare core item properties
  const sameItem =
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.poster_path === nextProps.item.poster_path &&
    prevProps.item.type === nextProps.item.type;

  // Compare user platforms (used for filtering loaded platforms)
  const sameUserPlatforms =
    prevProps.userPlatforms?.length === nextProps.userPlatforms?.length;

  return sameItem && sameUserPlatforms;
});
