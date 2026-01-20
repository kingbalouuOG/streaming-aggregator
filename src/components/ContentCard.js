/**
 * ContentCard Component
 * Displays content poster with multi-platform badges and title overlay
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, layout } from '../theme';
import GlassContainer from './GlassContainer';
import ProgressiveImage from './ProgressiveImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.4; // 40% of screen width

const ContentCard = ({ item, onPress }) => {
  const {
    id,
    title,
    name,
    poster_path,
    platforms = [],
  } = item;

  const displayTitle = title || name;
  const posterUrl = poster_path
    ? `https://image.tmdb.org/t/p/w342${poster_path}`
    : null;
  const thumbnailUrl = poster_path
    ? `https://image.tmdb.org/t/p/w92${poster_path}`
    : null;

  // Platform badge logic: show max 3, then "+N" for additional
  const visiblePlatforms = platforms.slice(0, 3);
  const remainingCount = platforms.length > 3 ? platforms.length - 3 : 0;

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
        {platforms.length > 0 && (
          <View style={styles.badgesContainer}>
            {visiblePlatforms.map((platform, index) => (
              <View
                key={`${platform.id}-${index}`}
                style={[
                  styles.badge,
                  index > 0 && { marginLeft: -spacing.sm },
                ]}
              >
                <View style={styles.badgeInner}>
                  <Text style={styles.badgeText}>
                    {platform.name?.charAt(0) || '?'}
                  </Text>
                </View>
              </View>
            ))}
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.overlay.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  badgeInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
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
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.poster_path === nextProps.item.poster_path &&
    prevProps.item.platforms?.length === nextProps.item.platforms?.length
  );
});
