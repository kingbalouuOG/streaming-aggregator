import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, layout } from '../theme';

const LocationScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const handleContinue = () => {
    // Navigate to PlatformsScreen
    // Region is hardcoded to 'GB' for UK market
    navigation.navigate('Platforms');
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={typography.h2}>Your Region</Text>
          <Text style={[typography.body, styles.subtitle]}>
            StreamFinder is currently available in the United Kingdom
          </Text>
        </View>

        {/* Region Display */}
        <View style={styles.content}>
          <View style={styles.regionCard}>
            <Text style={typography.h1}>🇬🇧</Text>
            <Text style={[typography.h3, styles.regionName]}>
              United Kingdom
            </Text>
            <Text style={[typography.caption, styles.regionDescription]}>
              Access content from UK streaming services
            </Text>
          </View>
        </View>

        {/* Continue Button */}
        <View style={[styles.footer, { paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.md) }]}>
          <Pressable style={styles.button} onPress={handleContinue}>
            <Text style={[typography.button, styles.buttonText]}>Continue</Text>
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
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.md,
    color: colors.text.secondary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  regionCard: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  regionName: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  regionDescription: {
    color: colors.text.secondary,
    textAlign: 'center',
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
  buttonText: {
    color: colors.text.primary,
  },
});

export default LocationScreen;
