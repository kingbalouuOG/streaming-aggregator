import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { colors, typography, spacing, layout } from '../theme';
import { saveUserPreferences } from '../storage/userPreferences';
import GlassContainer from '../components/GlassContainer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// UK Streaming Platforms with TMDb provider IDs
const PLATFORMS = [
  { id: 8, name: 'Netflix', selected: false },
  { id: 9, name: 'Amazon Prime Video', selected: false },
  { id: 350, name: 'Apple TV+', selected: false },
  { id: 337, name: 'Disney+', selected: false },
  { id: 39, name: 'Now TV', selected: false },
  { id: 38, name: 'BBC iPlayer', selected: false },
  { id: 41, name: 'ITVX', selected: false },
  { id: 103, name: 'Channel 4', selected: false },
];

const PlatformsScreen = ({ navigation }) => {
  const [platforms, setPlatforms] = useState(PLATFORMS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle platform selection
  const togglePlatform = (id) => {
    setPlatforms((prev) =>
      prev.map((platform) =>
        platform.id === id
          ? { ...platform, selected: !platform.selected }
          : platform
      )
    );
  };

  // Check if at least one platform is selected
  const hasSelection = () => {
    return platforms.some((platform) => platform.selected);
  };

  // Handle start browsing
  const handleStartBrowsing = async () => {
    if (!hasSelection()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Save selected platforms to user preferences
      await saveUserPreferences({
        region: 'GB', // UK region
        platforms: platforms.filter((p) => p.selected),
      });

      // Navigate to Main app using CommonActions.reset
      // This will reset the entire navigation state to show MainTabs
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    } catch (error) {
      console.error('[PlatformsScreen] Error saving preferences:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate card width: (screenWidth - 44) / 2
  // 44 = paddingHorizontal(24 * 2) + gap(12) - spacing adjustment
  const cardWidth = (SCREEN_WIDTH - spacing.xl * 2 - spacing.md) / 2;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={typography.h2}>Which services do you subscribe to?</Text>
        </View>

        {/* Platforms Grid */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {platforms.map((platform) => (
              <Pressable
                key={platform.id}
                onPress={() => togglePlatform(platform.id)}
                style={[styles.cardWrapper, { width: cardWidth }]}
              >
                <GlassContainer
                  style={[
                    styles.card,
                    platform.selected && styles.cardSelected,
                  ]}
                  borderRadius={layout.borderRadius.large}
                  borderWidth={platform.selected ? 2 : 1}
                >
                  <View style={styles.cardContent}>
                    <Text
                      style={[
                        typography.caption,
                        styles.platformName,
                        platform.selected && styles.platformNameSelected,
                      ]}
                      numberOfLines={2}
                    >
                      {platform.name}
                    </Text>
                  </View>
                </GlassContainer>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Start Browsing Button */}
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.button,
              (!hasSelection() || isSubmitting) && styles.buttonDisabled,
            ]}
            onPress={handleStartBrowsing}
            disabled={!hasSelection() || isSubmitting}
          >
            <Text style={[typography.button, styles.buttonText]}>
              {isSubmitting ? 'Saving...' : 'Start Browsing'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cardWrapper: {
    marginBottom: spacing.md,
  },
  card: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  cardSelected: {
    backgroundColor: colors.glass.medium,
    borderColor: colors.accent.primary,
  },
  cardContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformName: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
  platformNameSelected: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  footer: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
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

export default PlatformsScreen;
