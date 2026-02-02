/**
 * Progress Indicator Component
 * Linear and circular progress displays
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme, typography, spacing, layout } from '../theme';

const LinearProgress = ({
  progress = 0.5, // 0-1
  height = 4,
  borderRadius = layout.borderRadius.pill,
  showLabel = false,
  animated = true,
}) => {
  const { colors } = useTheme();
  const animatedValue = new Animated.Value(progress);

  React.useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(progress);
    }
  }, [progress, animated, animatedValue]);

  const width = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View>
      <View
        style={[
          styles.linearBar,
          {
            height,
            borderRadius,
            backgroundColor: colors.background.tertiary,
            overflow: 'hidden',
          },
        ]}
      >
        <Animated.View
          style={[
            styles.linearFill,
            {
              width,
              backgroundColor: colors.accent.primary,
              height: '100%',
              borderRadius,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text
          style={[
            typography.metadata,
            styles.label,
            { color: colors.text.secondary },
          ]}
        >
          {Math.round(progress * 100)}%
        </Text>
      )}
    </View>
  );
};

const CircularProgress = ({
  progress = 0.5, // 0-1
  size = 60,
  strokeWidth = 4,
  showLabel = true,
  color,
}) => {
  const { colors } = useTheme();
  const effectiveColor = color || colors.accent.primary;
  const circumference = 2 * Math.PI * ((size - strokeWidth) / 2);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View
      style={[
        styles.circularContainer,
        { width: size, height: size },
      ]}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={styles.svg}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          fill="none"
          stroke={colors.background.tertiary}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          fill="none"
          stroke={effectiveColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: `${size / 2}px ${size / 2}px`,
            transition: 'stroke-dashoffset 0.5s ease',
          }}
        />
      </svg>
      {showLabel && (
        <Text
          style={[
            typography.h4,
            styles.circularLabel,
            { color: colors.accent.primary },
          ]}
        >
          {Math.round(progress * 100)}%
        </Text>
      )}
    </View>
  );
};

const StepIndicator = ({
  steps = 3,
  currentStep = 0,
  labels,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.stepContainer}>
      {Array.from({ length: steps }).map((_, index) => (
        <View key={index} style={styles.stepWrapper}>
          {/* Step Circle */}
          <View
            style={[
              styles.stepCircle,
              {
                backgroundColor: index <= currentStep ? colors.accent.primary : colors.background.tertiary,
                borderWidth: 2,
                borderColor: index <= currentStep ? colors.accent.primary : colors.glass.border,
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: index <= currentStep ? colors.background.primary : colors.text.secondary,
                  fontWeight: '600',
                },
              ]}
            >
              {index + 1}
            </Text>
          </View>

          {/* Connector */}
          {index < steps - 1 && (
            <View
              style={[
                styles.stepConnector,
                {
                  backgroundColor: index < currentStep ? colors.accent.primary : colors.background.tertiary,
                },
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  linearBar: {
    overflow: 'hidden',
  },
  linearFill: {
    opacity: 0.9,
  },
  label: {
    marginTop: spacing.xs,
    fontSize: 12,
  },
  circularContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  circularLabel: {
    fontSize: 14,
    fontWeight: '600',
    zIndex: 1,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepConnector: {
    position: 'absolute',
    height: 2,
    left: '50%',
    right: -50,
    zIndex: -1,
  },
});

export { LinearProgress, CircularProgress, StepIndicator };
export default LinearProgress;
