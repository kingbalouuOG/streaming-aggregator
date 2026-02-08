import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
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
import { setHomeGenres, DEFAULT_HOME_GENRES } from '../storage/userPreferences';
import OnboardingProgressBar from '../components/OnboardingProgressBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Genre emojis matching web design
const GENRE_EMOJIS: Record<number, string> = {
  28: '💥',     // Action
  12: '🗺️',    // Adventure
  16: '✨',     // Animation
  35: '😂',     // Comedy
  80: '🔍',     // Crime
  99: '🎬',     // Documentary
  18: '🎭',     // Drama
  10751: '👨‍👩‍👧‍👦', // Family
  14: '🧙‍♂️',   // Fantasy
  36: '📜',     // History
  27: '👻',     // Horror
  10402: '🎵',  // Music
  9648: '🔮',   // Mystery
  10749: '💕',  // Romance
  878: '🚀',    // Sci-Fi
  53: '😱',     // Thriller
  10752: '⚔️',  // War
  37: '🤠',     // Western
};

// All available genres
const GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

interface GenrePreferencesScreenProps {
  navigation: any;
}

interface AnimatedGenreChipProps {
  genre: { id: number; name: string };
  isSelected: boolean;
  onPress: () => void;
  index: number;
  colors: any;
}

const AnimatedGenreChip: React.FC<AnimatedGenreChipProps> = ({
  genre,
  isSelected,
  onPress,
  index,
  colors,
}) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    // Animate chip press
    scale.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    onPress();
  };

  const chipAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const emoji = GENRE_EMOJIS[genre.id] || '🎬';

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 30, 400)).springify().damping(22).stiffness(300)}
      style={chipAnimatedStyle}
    >
      <Pressable
        style={[
          styles.chip,
          {
            backgroundColor: isSelected
              ? colors.accent.primary + '26'
              : colors.background.tertiary,
            borderColor: isSelected
              ? colors.accent.primary
              : colors.glass.border,
          },
        ]}
        onPress={handlePress}
      >
        <Text style={styles.chipEmoji}>{emoji}</Text>
        <Text
          style={[
            styles.chipText,
            {
              color: isSelected ? colors.accent.primary : colors.text.secondary,
              fontWeight: isSelected ? '600' : '400',
            },
          ]}
        >
          {genre.name}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const GenrePreferencesScreen: React.FC<GenrePreferencesScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation values
  const buttonScale = useSharedValue(1);

  // Toggle genre selection
  const toggleGenre = useCallback((id: number) => {
    setSelectedGenres((prev) =>
      prev.includes(id)
        ? prev.filter((genreId) => genreId !== id)
        : [...prev, id]
    );
  }, []);

  // Check if genre is selected
  const isSelected = (id: number) => selectedGenres.includes(id);

  // Navigate to main app
  const navigateToMain = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      })
    );
  };

  // Handle continue with selections
  const handleContinue = async () => {
    if (selectedGenres.length === 0) {
      return;
    }

    // Animate button
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15 })
    );

    setIsSubmitting(true);

    try {
      await setHomeGenres(selectedGenres);
      navigateToMain();
    } catch (error) {
      console.error('[GenrePreferencesScreen] Error saving genres:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle skip - use default genres
  const handleSkip = async () => {
    setIsSubmitting(true);

    try {
      await setHomeGenres(DEFAULT_HOME_GENRES);
      navigateToMain();
    } catch (error) {
      console.error('[GenrePreferencesScreen] Error saving default genres:', error);
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
      <OnboardingProgressBar currentStep={4} totalSteps={4} />

      <View style={styles.container}>
        {/* Header with Skip button */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerSpacer} />
            <Pressable
              onPress={handleSkip}
              disabled={isSubmitting}
              style={styles.skipButton}
            >
              <Text style={[typography.body, styles.skipText, { color: colors.text.secondary }]}>Skip</Text>
            </Pressable>
          </View>
          <Animated.View entering={FadeInDown.delay(100).springify().damping(22).stiffness(300)}>
            <Text style={[typography.h2, { color: colors.text.primary }]}>What do you like to watch?</Text>
            <Text style={[typography.body, styles.subtitle, { color: colors.text.secondary }]}>
              Select genres you're interested in
            </Text>
          </Animated.View>
        </View>

        {/* Genres Grid */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {GENRES.map((genre, index) => (
              <AnimatedGenreChip
                key={genre.id}
                genre={genre}
                isSelected={isSelected(genre.id)}
                onPress={() => toggleGenre(genre.id)}
                index={index}
                colors={colors}
              />
            ))}
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={[styles.footer, { paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.md) }]}>
          <Animated.View style={buttonAnimatedStyle}>
            <Pressable
              style={[
                styles.button,
                { backgroundColor: colors.accent.primary },
                (selectedGenres.length === 0 || isSubmitting) && styles.buttonDisabled,
              ]}
              onPress={handleContinue}
              disabled={selectedGenres.length === 0 || isSubmitting}
            >
              <Text style={[typography.button, styles.buttonText]}>
                {isSubmitting ? 'Getting Started...' : `Let's Go! (${selectedGenres.length} selected)`}
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerSpacer: {
    width: 50,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipText: {},
  subtitle: {
    marginTop: spacing.sm,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 2,
    gap: 6,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 13,
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

export default GenrePreferencesScreen;
