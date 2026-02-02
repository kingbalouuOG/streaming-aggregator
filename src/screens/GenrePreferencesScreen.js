import React, { useState } from 'react';
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
import { colors, typography, spacing, layout } from '../theme';
import { setHomeGenres, DEFAULT_HOME_GENRES } from '../storage/userPreferences';
import GlassContainer from '../components/GlassContainer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// All available genres (matching FilterModal)
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

const GenrePreferencesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle genre selection
  const toggleGenre = (id) => {
    setSelectedGenres((prev) =>
      prev.includes(id)
        ? prev.filter((genreId) => genreId !== id)
        : [...prev, id]
    );
  };

  // Check if genre is selected
  const isSelected = (id) => selectedGenres.includes(id);

  // Handle continue with selections
  const handleContinue = async () => {
    if (selectedGenres.length === 0) {
      return;
    }

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

  // Navigate to main app
  const navigateToMain = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      })
    );
  };

  // Calculate chip width for 3-column grid
  const chipWidth = (SCREEN_WIDTH - spacing.xl * 2 - spacing.sm * 2) / 3;

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
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
              <Text style={[typography.body, styles.skipText]}>Skip</Text>
            </Pressable>
          </View>
          <Text style={typography.h2}>What do you like to watch?</Text>
          <Text style={[typography.body, styles.subtitle]}>
            Select genres you're interested in
          </Text>
        </View>

        {/* Genres Grid */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {GENRES.map((genre) => (
              <Pressable
                key={genre.id}
                onPress={() => toggleGenre(genre.id)}
                style={[styles.chipWrapper, { width: chipWidth }]}
              >
                <GlassContainer
                  style={[
                    styles.chip,
                    isSelected(genre.id) && styles.chipSelected,
                  ]}
                  borderRadius={layout.borderRadius.pill}
                  borderWidth={2}
                >
                  <Text
                    style={[
                      typography.caption,
                      styles.chipText,
                      isSelected(genre.id) && styles.chipTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {genre.name}
                  </Text>
                </GlassContainer>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={[styles.footer, { paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.md) }]}>
          <Pressable
            style={[
              styles.button,
              (selectedGenres.length === 0 || isSubmitting) && styles.buttonDisabled,
            ]}
            onPress={handleContinue}
            disabled={selectedGenres.length === 0 || isSubmitting}
          >
            <Text style={[typography.button, styles.buttonText]}>
              {isSubmitting ? 'Saving...' : `Continue (${selectedGenres.length} selected)`}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    paddingTop: spacing.md,
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
  skipText: {
    color: colors.text.secondary,
  },
  subtitle: {
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chipWrapper: {
    // No marginBottom - grid gap handles spacing
  },
  chip: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: colors.glass.medium,
    borderColor: colors.accent.primary,
  },
  chipText: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
  chipTextSelected: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  footer: {
    paddingTop: spacing.lg,
  },
  button: {
    height: 50,
    backgroundColor: colors.accent.primary,
    borderRadius: layout.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.text.primary,
  },
});

export default GenrePreferencesScreen;
