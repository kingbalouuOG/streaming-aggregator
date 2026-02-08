import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../theme';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({
  currentStep,
  totalSteps,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.track, { backgroundColor: colors.background.tertiary }]}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <ProgressSegment
            key={index}
            index={index}
            isActive={index < currentStep}
            isCurrent={index === currentStep - 1}
            isLast={index === totalSteps - 1}
            colors={colors}
          />
        ))}
      </View>
    </View>
  );
};

interface ProgressSegmentProps {
  index: number;
  isActive: boolean;
  isCurrent: boolean;
  isLast: boolean;
  colors: any;
}

const ProgressSegment: React.FC<ProgressSegmentProps> = ({
  index,
  isActive,
  isCurrent,
  isLast,
  colors,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      progress.value = withSpring(1, {
        damping: 22,
        stiffness: 300,
      });
    } else {
      progress.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    flex: 1,
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 3,
    opacity: progress.value,
    transform: [{ scaleX: progress.value }],
  }));

  return (
    <View
      style={[
        styles.segment,
        !isLast && styles.segmentMargin,
      ]}
    >
      <Animated.View style={animatedStyle} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  track: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
  },
  segmentMargin: {
    marginRight: 4,
  },
});

export default OnboardingProgressBar;
