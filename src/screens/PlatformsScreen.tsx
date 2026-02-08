import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, typography, spacing, layout } from '../theme';
import { saveUserPreferences } from '../storage/userPreferences';
import { UK_PROVIDERS_ARRAY } from '../constants/platforms';
import OnboardingProgressBar from '../components/OnboardingProgressBar';

// Service colors matching web design
const SERVICE_COLORS: Record<number, { bg: string; label: string }> = {
  8: { bg: '#E50914', label: 'N' },      // Netflix
  9: { bg: '#00A8E1', label: 'P' },      // Prime Video
  350: { bg: '#1A1A1A', label: 'tv' },   // Apple TV+
  337: { bg: '#0063E5', label: 'D+' },   // Disney+
  1899: { bg: '#5C16C5', label: 'M' },   // Max (HBO)
  531: { bg: '#0064FF', label: 'P+' },   // Paramount+
  15: { bg: '#1CE783', label: 'H' },     // Hulu
  283: { bg: '#F47521', label: 'CR' },   // Crunchyroll
};

interface PlatformsScreenProps {
  navigation: any;
}

interface AnimatedPlatformCardProps {
  platform: { id: number; name: string; color: string };
  isSelected: boolean;
  onPress: () => void;
  index: number;
  colors: any;
}

const AnimatedPlatformCard: React.FC<AnimatedPlatformCardProps> = ({
  platform,
  isSelected,
  onPress,
  index,
  colors,
}) => {
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(isSelected ? 1 : 0);

  const handlePress = () => {
    // Animate card press
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15 })
    );

    // Animate checkmark
    if (!isSelected) {
      checkScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    } else {
      checkScale.value = withTiming(0, { duration: 150 });
    }

    onPress();
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  // Update checkScale when selection changes externally
  React.useEffect(() => {
    checkScale.value = withSpring(isSelected ? 1 : 0, { damping: 15 });
  }, [isSelected]);

  const serviceColor = SERVICE_COLORS[platform.id] || { bg: platform.color, label: '?' };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify().damping(22).stiffness(300)}
      style={[styles.cardWrapper, cardAnimatedStyle]}
    >
      <Pressable
        style={[
          styles.platformCard,
          {
            backgroundColor: colors.background.tertiary,
            borderColor: isSelected ? colors.accent.primary : colors.glass.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={handlePress}
      >
        <View style={[styles.platformBadge, { backgroundColor: serviceColor.bg }]}>
          <Text style={styles.platformBadgeText}>{serviceColor.label}</Text>
        </View>
        <Text
          style={[styles.platformName, { color: colors.text.primary }]}
          numberOfLines={1}
        >
          {platform.name}
        </Text>

        {/* Animated Checkmark */}
        <Animated.View
          style={[
            styles.checkCircle,
            {
              backgroundColor: isSelected ? colors.accent.primary : 'transparent',
              borderColor: isSelected ? colors.accent.primary : colors.glass.border,
            },
            checkAnimatedStyle,
          ]}
        >
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const PlatformsScreen: React.FC<PlatformsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation values
  const buttonScale = useSharedValue(1);

  // Toggle platform selection
  const togglePlatform = useCallback((platformId: number) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  }, []);

  // Check if at least one platform is selected
  const hasSelection = () => selectedPlatforms.length > 0;

  // Handle next button
  const handleNext = async () => {
    if (!hasSelection()) {
      return;
    }

    // Animate button
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15 })
    );

    setIsSubmitting(true);

    try {
      // Save selected platforms to user preferences
      await saveUserPreferences({
        region: 'GB',
        platforms: UK_PROVIDERS_ARRAY
          .filter((p) => selectedPlatforms.includes(p.id))
          .map((p) => ({ id: p.id, name: p.name, selected: true })),
      });

      // Navigate to Genre Preferences screen
      navigation.navigate('GenrePreferences');
    } catch (error) {
      console.error('[PlatformsScreen] Error saving preferences:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>
      {/* Progress Bar */}
      <OnboardingProgressBar currentStep={3} totalSteps={4} />

      <View style={styles.container}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).springify().damping(22).stiffness(300)}
          style={styles.header}
        >
          <Text style={[typography.h2, { color: colors.text.primary }]}>
            Which services do you subscribe to?
          </Text>
          <Text style={[typography.body, styles.subtitle, { color: colors.text.secondary }]}>
            Select all that apply
          </Text>
        </Animated.View>

        {/* Platforms Grid */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {UK_PROVIDERS_ARRAY.map((platform, index) => (
              <AnimatedPlatformCard
                key={platform.id}
                platform={platform}
                isSelected={selectedPlatforms.includes(platform.id)}
                onPress={() => togglePlatform(platform.id)}
                index={index}
                colors={colors}
              />
            ))}
          </View>
        </ScrollView>

        {/* Next Button */}
        <View style={[styles.footer, { paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.md) }]}>
          <Animated.View style={buttonAnimatedStyle}>
            <Pressable
              style={[
                styles.button,
                { backgroundColor: colors.accent.primary },
                (!hasSelection() || isSubmitting) && styles.buttonDisabled,
              ]}
              onPress={handleNext}
              disabled={!hasSelection() || isSubmitting}
            >
              <Text style={[typography.button, styles.buttonText]}>
                {isSubmitting ? 'Saving...' : `Next (${selectedPlatforms.length} selected)`}
              </Text>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardWrapper: {
    width: '47%',
  },
  platformCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  platformBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  platformName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingTop: spacing.lg,
  },
  button: {
    height: 50,
    borderRadius: layout.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default PlatformsScreen;
