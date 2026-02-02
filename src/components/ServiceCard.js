/**
 * ServiceCard Component
 * Multi-select card for streaming service selection
 * Uses opacity for muted state, full color + glow for selected
 */

import React from 'react';
import { Text, StyleSheet, Pressable, View, Image } from 'react-native';
import { colors, typography, spacing, layout } from '../theme';

// Platform logo mappings - all platforms
const PLATFORM_LOGOS = {
  8: require('../../assets/platform-logos/Netflix-logo.png'),
  9: require('../../assets/platform-logos/Amazon-Prime-logo.png'),
  350: require('../../assets/platform-logos/Apple-TV-logo.png'),
  337: require('../../assets/platform-logos/Disney_plus_logo.png'),
  39: require('../../assets/platform-logos/now-tv-logo.png'),
  38: require('../../assets/platform-logos/bbc-iplayer-logo.png'),
  54: require('../../assets/platform-logos/itvx-logo.png'),
  103: require('../../assets/platform-logos/channel4-logo.png'),
  582: require('../../assets/platform-logos/paramount-logo.png'),
  29: require('../../assets/platform-logos/skygo-logo.png'),
};

const ServiceCard = ({ platformId, name, color, selected, onPress }) => {
  const hasLogo = PLATFORM_LOGOS[platformId] !== undefined;
  const initial = name.charAt(0).toUpperCase();

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <View style={[styles.card, selected && styles.cardSelected]}>
        {/* Logo or Initial Fallback */}
        {hasLogo ? (
          <Image
            source={PLATFORM_LOGOS[platformId]}
            style={[styles.logo, !selected && styles.logoMuted]}
            resizeMode="contain"
          />
        ) : (
          <View style={[
            styles.initialCircle,
            { backgroundColor: color },
            !selected && styles.initialMuted
          ]}>
            <Text style={styles.initialText}>{initial}</Text>
          </View>
        )}

        {/* Platform Name */}
        <Text
          style={[
            typography.caption,
            styles.name,
            selected && styles.nameSelected,
          ]}
          numberOfLines={1}
        >
          {name}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '50%',
  },
  card: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    backgroundColor: colors.background.tertiary,
    borderRadius: layout.borderRadius.large,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  cardSelected: {
    borderColor: colors.accent.primary,
    borderWidth: 2,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: 52,
    height: 52,
    marginBottom: spacing.sm,
  },
  logoMuted: {
    opacity: 0.4,
  },
  initialCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  initialMuted: {
    opacity: 0.4,
  },
  initialText: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  name: {
    color: colors.text.tertiary,
    fontWeight: '600',
    textAlign: 'center',
  },
  nameSelected: {
    color: colors.text.primary,
  },
});

export default ServiceCard;
