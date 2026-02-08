import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, typography, spacing, layout } from '../theme';
import OnboardingProgressBar from '../components/OnboardingProgressBar';

interface LocationScreenProps {
  navigation: any;
}

const LocationScreen: React.FC<LocationScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Animation values
  const flagScale = useSharedValue(0);
  const flagRotation = useSharedValue(-10);
  const buttonScale = useSharedValue(1);

  // Animate flag on mount
  useEffect(() => {
    flagScale.value = withSpring(1, { damping: 12, stiffness: 150 });
    flagRotation.value = withSpring(0, { damping: 15, stiffness: 100 });
  }, []);

  const handleContinue = () => {
    // Animate button press
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15 })
    );

    // Navigate to PlatformsScreen
    navigation.navigate('Platforms');
  };

  // Animated styles
  const flagAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: flagScale.value },
      { rotate: `${flagRotation.value}deg` },
    ],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>
      {/* Progress Bar */}
      <OnboardingProgressBar currentStep={2} totalSteps={4} />

      <View style={styles.container}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).springify().damping(22).stiffness(300)}
          style={styles.header}
        >
          <Text style={[typography.h2, { color: colors.text.primary }]}>Your Region</Text>
          <Text style={[typography.body, styles.subtitle, { color: colors.text.secondary }]}>
            StreamFinder is currently available in the United Kingdom
          </Text>
        </Animated.View>

        {/* Region Display */}
        <View style={styles.content}>
          <Animated.View style={[styles.regionCard, flagAnimatedStyle]}>
            <Text style={styles.flagEmoji}>🇬🇧</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).springify().damping(22).stiffness(300)}>
            <Text style={[typography.h3, styles.regionName, { color: colors.text.primary }]}>
              United Kingdom
            </Text>
            <Text style={[typography.caption, styles.regionDescription, { color: colors.text.secondary }]}>
              Access content from UK streaming services
            </Text>
          </Animated.View>
        </View>

        {/* Continue Button */}
        <View style={[styles.footer, { paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.md) }]}>
          <Animated.View style={buttonAnimatedStyle}>
            <Pressable
              style={[styles.button, { backgroundColor: colors.accent.primary }]}
              onPress={handleContinue}
            >
              <Text style={[typography.button, styles.buttonText]}>Continue</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  regionCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  flagEmoji: {
    fontSize: 80,
  },
  regionName: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  regionDescription: {
    textAlign: 'center',
  },
  footer: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  button: {
    height: 50,
    borderRadius: layout.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default LocationScreen;
