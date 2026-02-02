import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, layout } from '../theme';
import { saveUserPreferences } from '../storage/userPreferences';
import { UK_PROVIDERS_ARRAY } from '../constants/platforms';
import ServiceCard from '../components/ServiceCard';

const PlatformsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle platform selection
  const togglePlatform = (platformId) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  // Check if at least one platform is selected
  const hasSelection = () => {
    return selectedPlatforms.length > 0;
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

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
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
            {UK_PROVIDERS_ARRAY.map((platform) => (
              <ServiceCard
                key={platform.id}
                platformId={platform.id}
                name={platform.name}
                color={platform.color}
                selected={selectedPlatforms.includes(platform.id)}
                onPress={() => togglePlatform(platform.id)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Start Browsing Button */}
        <View style={[styles.footer, { paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.md) }]}>
          <Pressable
            style={[
              styles.button,
              (!hasSelection() || isSubmitting) && styles.buttonDisabled,
            ]}
            onPress={handleStartBrowsing}
            disabled={!hasSelection() || isSubmitting}
          >
            <Text style={[typography.button, styles.buttonText]}>
              {isSubmitting ? 'Saving...' : 'Next'}
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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

export default PlatformsScreen;
