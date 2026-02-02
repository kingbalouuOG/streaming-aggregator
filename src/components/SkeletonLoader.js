/**
 * Skeleton Loader Component
 * Placeholder animation while content loads
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme, spacing, layout } from '../theme';

const SkeletonLoader = ({
  width = '100%',
  height = 16,
  borderRadius = layout.borderRadius.small,
  style,
}) => {
  const { colors } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.background.tertiary,
          opacity,
        },
        style,
      ]}
    />
  );
};

const SkeletonGroup = ({ count = 3, spacing: customSpacing = spacing.md, ...props }) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={index > 0 && { marginTop: customSpacing }}>
          <SkeletonLoader {...props} />
        </View>
      ))}
    </View>
  );
};

const SkeletonCard = ({ style }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.background.secondary }, style]}>
      <SkeletonLoader
        width="40%"
        height={120}
        borderRadius={layout.borderRadius.medium}
        style={{ marginRight: spacing.lg }}
      />
      <View style={{ flex: 1 }}>
        <SkeletonLoader height={16} width="80%" style={{ marginBottom: spacing.sm }} />
        <SkeletonLoader height={14} width="100%" style={{ marginBottom: spacing.sm }} />
        <SkeletonLoader height={14} width="60%" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    borderRadius: layout.borderRadius.small,
  },
  card: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: layout.borderRadius.medium,
    marginBottom: spacing.md,
  },
});

export { SkeletonLoader, SkeletonGroup, SkeletonCard };
export default SkeletonLoader;
