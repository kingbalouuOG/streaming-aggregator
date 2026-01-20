/**
 * GlassContainer Component
 * Glass morphism effect with platform-specific implementations
 * - iOS: Uses BlurView for true glass effect
 * - Android: Uses semi-transparent background (fallback)
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../theme';

const GlassContainer = ({
  children,
  style,
  intensity = 80,
  tint = 'dark',
  borderRadius = 12,
  borderWidth = 1,
  ...props
}) => {
  if (Platform.OS === 'ios') {
    // iOS: Use BlurView for true glass morphism
    return (
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[
          styles.container,
          {
            borderRadius,
            borderWidth,
            borderColor: colors.glass.border,
            overflow: 'hidden',
          },
          style,
        ]}
        {...props}
      >
        {children}
      </BlurView>
    );
  }

  // Android: Fallback to semi-transparent background
  return (
    <View
      style={[
        styles.container,
        styles.androidFallback,
        {
          borderRadius,
          borderWidth,
          borderColor: colors.glass.border,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Base styles
  },
  androidFallback: {
    backgroundColor: colors.glass.light,
  },
});

export default GlassContainer;
