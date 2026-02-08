/**
 * ImageSkeleton Component
 *
 * Image component with shimmer loading animation
 * Shows shimmer placeholder until image loads, then fades in
 * Uses Reanimated for 60fps performance
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ViewStyle,
  ImageStyle,
  ImageSourcePropType,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  interpolate,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ImageSkeletonProps {
  source: ImageSourcePropType;
  style?: ViewStyle | ImageStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  borderRadius?: number;
  onLoad?: () => void;
  onError?: () => void;
}

// Animated LinearGradient for shimmer
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const ImageSkeleton: React.FC<ImageSkeletonProps> = ({
  source,
  style,
  resizeMode = 'cover',
  borderRadius = 0,
  onLoad,
  onError,
}) => {
  const { colors } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reanimated shared values
  const shimmerPosition = useSharedValue(0);
  const imageOpacity = useSharedValue(0);

  // Start shimmer animation
  useEffect(() => {
    if (!isLoaded && !hasError) {
      // Start shimmer loop
      shimmerPosition.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.linear }),
        -1, // infinite
        false // don't reverse
      );

      // Stop shimmer after 5 seconds if image still hasn't loaded
      const timeout = setTimeout(() => {
        cancelAnimation(shimmerPosition);
      }, 5000);

      return () => {
        clearTimeout(timeout);
        cancelAnimation(shimmerPosition);
      };
    } else {
      // Stop shimmer when loaded or errored
      cancelAnimation(shimmerPosition);
    }
  }, [isLoaded, hasError, shimmerPosition]);

  // Fade in image when loaded
  useEffect(() => {
    if (isLoaded) {
      imageOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [isLoaded, imageOpacity]);

  // Shimmer animated style
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmerPosition.value, [0, 1], [-200, 200]) },
    ],
  }));

  // Image opacity animated style
  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const containerStyle: ViewStyle = {
    overflow: 'hidden',
    backgroundColor: colors.background.tertiary,
    borderRadius,
    ...(style as ViewStyle),
  };

  return (
    <View style={containerStyle}>
      {/* Shimmer placeholder */}
      {!isLoaded && !hasError && (
        <View style={[StyleSheet.absoluteFill, styles.shimmerContainer]}>
          <Animated.View style={[styles.shimmer, shimmerStyle]}>
            <LinearGradient
              colors={[
                'transparent',
                colors.semantic?.shimmer || 'rgba(255,255,255,0.04)',
                'transparent',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shimmerGradient}
            />
          </Animated.View>
        </View>
      )}

      {/* Actual image */}
      <Animated.Image
        source={source}
        style={[
          StyleSheet.absoluteFill,
          { borderRadius },
          imageStyle,
        ]}
        resizeMode={resizeMode}
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Error fallback */}
      {hasError && (
        <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
          <View style={styles.errorIcon} />
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  shimmerContainer: {
    backgroundColor: 'transparent',
  },
  shimmer: {
    flex: 1,
    width: '200%',
  },
  shimmerGradient: {
    flex: 1,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});

// ─────────────────────────────────────────────────────────────
// Memoized Export
// ─────────────────────────────────────────────────────────────

export default memo(ImageSkeleton);
