/**
 * RatingSlider Component
 * Custom slider for minimum rating threshold (0-10)
 */

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';
import { colors, typography, spacing, layout } from '../theme';

const RatingSlider = ({
  value = 0,
  onChange,
  minValue = 0,
  maxValue = 10,
  step = 0.5,
}) => {
  const trackWidth = useRef(0);
  const [localValue, setLocalValue] = useState(value);
  const thumbScale = useRef(new Animated.Value(1)).current;

  const getValueLabel = (val) => {
    if (val === 0) return 'Any';
    return `${val.toFixed(1)}+`;
  };

  const clampValue = (val) => {
    const clamped = Math.max(minValue, Math.min(maxValue, val));
    // Round to nearest step
    return Math.round(clamped / step) * step;
  };

  const getThumbPosition = (val) => {
    const range = maxValue - minValue;
    return ((val - minValue) / range) * 100;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Animated.spring(thumbScale, {
          toValue: 1.2,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        if (trackWidth.current > 0) {
          const range = maxValue - minValue;
          const newValue = minValue + (gestureState.moveX / trackWidth.current) * range;
          const clampedValue = clampValue(newValue);
          setLocalValue(clampedValue);
        }
      },
      onPanResponderRelease: () => {
        Animated.spring(thumbScale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
        onChange(localValue);
      },
    })
  ).current;

  const handleTrackPress = (event) => {
    const { locationX } = event.nativeEvent;
    if (trackWidth.current > 0) {
      const range = maxValue - minValue;
      const newValue = minValue + (locationX / trackWidth.current) * range;
      const clampedValue = clampValue(newValue);
      setLocalValue(clampedValue);
      onChange(clampedValue);
    }
  };

  const thumbPosition = getThumbPosition(localValue);

  return (
    <View style={styles.container}>
      <Text style={[typography.h4, styles.valueLabel]}>
        {getValueLabel(localValue)}
      </Text>
      <View
        style={styles.trackContainer}
        onLayout={(e) => {
          trackWidth.current = e.nativeEvent.layout.width;
        }}
        onStartShouldSetResponder={() => true}
        onResponderRelease={handleTrackPress}
      >
        <View style={styles.track}>
          <View
            style={[
              styles.trackFilled,
              { width: `${thumbPosition}%` },
            ]}
          />
        </View>
        <Animated.View
          style={[
            styles.thumb,
            {
              left: `${thumbPosition}%`,
              transform: [
                { translateX: -12 },
                { scale: thumbScale },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        />
      </View>
      <View style={styles.labels}>
        <Text style={styles.label}>0</Text>
        <Text style={styles.label}>5</Text>
        <Text style={styles.label}>10</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  valueLabel: {
    color: colors.accent.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  trackContainer: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  track: {
    height: 4,
    backgroundColor: colors.background.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackFilled: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 2,
    // Glow effect
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent.primary,
    // Glow effect
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: spacing.xs,
  },
  label: {
    ...typography.metadata,
    color: colors.text.tertiary,
  },
});

export default RatingSlider;
