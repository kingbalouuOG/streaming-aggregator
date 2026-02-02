/**
 * GlassContainer Component
 * Glass morphism effect with platform-specific implementations
 * - iOS: Uses BlurView for true glass effect
 * - Android: Uses semi-transparent background (fallback)
 */

import React from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme, spacing } from '../theme';

const GlassContainer = ({
  children,
  style,
  intensity = 80,
  borderRadius = 12,
  borderWidth = 1,
  pressable = false,
  onPress,
  ...props
}) => {
  const { colors, isDark } = useTheme();
  const tint = isDark ? 'dark' : 'light';

  const containerStyle = {
    borderRadius,
    borderWidth,
    borderColor: colors.glass.border,
    backgroundColor: isDark ? colors.glass.light : colors.glass.light,
  };

  if (Platform.OS === 'ios') {
    // iOS: Use BlurView for true glass morphism
    return (
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[
          styles.container,
          containerStyle,
          style,
        ]}
        {...props}
      >
        {pressable ? (
          <Pressable
            onPress={onPress}
            style={({ pressed }) => [
              StyleSheet.absoluteFillObject,
              pressed && styles.pressed,
            ]}
          />
        ) : null}
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
        containerStyle,
        style,
      ]}
      {...props}
    >
      {pressable ? (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            StyleSheet.absoluteFillObject,
            pressed && styles.pressed,
          ]}
        />
      ) : null}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  androidFallback: {
    // Defined dynamically based on theme
  },
  pressed: {
    opacity: 0.85,
  },
});

export default GlassContainer;
