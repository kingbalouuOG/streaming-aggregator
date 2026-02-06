/**
 * RatingControl Component
 * Thumbs up/down/neutral rating selector
 */

import React, { memo } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing } from '../theme';

const RatingControl = ({
  value = 0,
  onChange,
  disabled = false,
  size = 'medium',
  showLabels = false,
  style,
}) => {
  const { colors } = useTheme();

  const sizes = {
    small: { icon: 20, button: 36 },
    medium: { icon: 24, button: 44 },
    large: { icon: 28, button: 52 },
  };

  const currentSize = sizes[size] || sizes.medium;

  const handlePress = (rating) => {
    if (disabled) return;
    // Toggle off if pressing the same rating
    const newRating = value === rating ? 0 : rating;
    onChange?.(newRating);
  };

  const RatingButton = ({ rating, icon, activeColor, label }) => {
    const isActive = value === rating;
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.9,
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
        onPress={() => handlePress(rating)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          {
            width: currentSize.button,
            height: currentSize.button,
            backgroundColor: isActive
              ? activeColor
              : colors.background.tertiary,
            opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons
            name={isActive ? icon : `${icon}-outline`}
            size={currentSize.icon}
            color={isActive ? '#FFFFFF' : colors.text.secondary}
          />
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <RatingButton
        rating={-1}
        icon="thumbs-down"
        activeColor={colors.accent.error}
        label="Dislike"
      />
      <RatingButton
        rating={0}
        icon="remove-circle"
        activeColor={colors.text.tertiary}
        label="Neutral"
      />
      <RatingButton
        rating={1}
        icon="thumbs-up"
        activeColor={colors.accent.success}
        label="Like"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  button: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default memo(RatingControl);
