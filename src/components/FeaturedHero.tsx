/**
 * FeaturedHero Component
 *
 * Parallax hero banner for home screen
 * Pixel-perfect match to web design
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ServiceBadge } from './ServiceBadge';
import { FeaturedHeroProps, ServiceType } from '../types';
import { layout } from '../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 420;

// ─────────────────────────────────────────────────────────────
// Animated Image Background
// ─────────────────────────────────────────────────────────────

const AnimatedImageBackground = Animated.createAnimatedComponent(ImageBackground);

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const FeaturedHero: React.FC<FeaturedHeroProps> = ({
  title,
  subtitle,
  image,
  services,
  tags = [],
  bookmarked = false,
  onToggleBookmark,
  scrollY,
}) => {
  const { colors } = useTheme();

  // Parallax animation styles
  const imageAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, HERO_HEIGHT],
      [0, HERO_HEIGHT * 0.4],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [0, HERO_HEIGHT],
      [1, 1.12],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  const contentAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HERO_HEIGHT * 0.6],
      [1, 0],
      Extrapolation.CLAMP
    );

    return { opacity };
  });

  return (
    <View style={styles.container}>
      {/* Parallax Background Image */}
      <AnimatedImageBackground
        source={{ uri: image }}
        style={[styles.backgroundImage, imageAnimatedStyle]}
        resizeMode="cover"
      >
        {/* Gradient Overlay */}
        <LinearGradient
          colors={[
            'transparent',
            `rgba(10, 10, 15, 0.4)`,
            colors.background.primary,
          ]}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
        />
      </AnimatedImageBackground>

      {/* Content */}
      <Animated.View style={[styles.content, contentAnimatedStyle]}>
        {/* Service badges with availability text */}
        <View style={styles.serviceRow}>
          {services.slice(0, 1).map((service) => (
            <ServiceBadge key={service} service={service} size="md" />
          ))}
          <Text style={[styles.availabilityText, { color: colors.text.secondary }]}>
            Available on {services.length} service{services.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {title}
        </Text>

        {/* Subtitle */}
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {subtitle}
          </Text>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <Text style={[styles.tags, { color: colors.text.secondary }]}>
            {tags.join(' • ')}
          </Text>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Pressable
            onPress={onToggleBookmark}
            style={[
              styles.watchlistButton,
              { backgroundColor: colors.accent.primary },
            ]}
          >
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.watchlistButtonText}>
              {bookmarked ? 'In Watchlist' : 'Add to Watchlist'}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.infoButton,
              {
                backgroundColor: colors.background.tertiary,
                borderColor: colors.semantic?.borderSubtle || 'transparent',
              },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={colors.text.primary}
            />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    height: HERO_HEIGHT,
    width: SCREEN_WIDTH,
    overflow: 'hidden',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT + 100, // Extra for parallax
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 16,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  availabilityText: {
    fontSize: 13,
    fontWeight: '400',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    marginBottom: 8,
  },
  tags: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  watchlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  watchlistButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

export default FeaturedHero;
