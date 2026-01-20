/**
 * PlatformBadge Component
 * Circular badge with platform logo and semi-transparent background
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, typography } from '../theme';

// Platform logo mappings (using initials as fallback)
const PLATFORM_LOGOS = {
  8: { name: 'Netflix', initial: 'N', color: colors.platforms.netflix },
  9: { name: 'Prime', initial: 'P', color: colors.platforms.amazon },
  350: { name: 'Apple TV+', initial: 'A', color: colors.platforms.apple },
  337: { name: 'Disney+', initial: 'D', color: colors.platforms.disney },
  39: { name: 'Now TV', initial: 'N', color: colors.platforms.nowTV },
  38: { name: 'iPlayer', initial: 'B', color: colors.platforms.bbc },
  41: { name: 'ITVX', initial: 'I', color: colors.platforms.itvx },
  103: { name: 'C4', initial: 'C', color: colors.platforms.channel4 },
};

const PlatformBadge = ({ platformId, size = 32 }) => {
  const platform = PLATFORM_LOGOS[platformId] || { initial: '?', color: colors.text.tertiary };

  const badgeSize = {
    24: { size: 24, borderRadius: 12, fontSize: 10 },
    32: { size: 32, borderRadius: 16, fontSize: 12 },
    40: { size: 40, borderRadius: 20, fontSize: 14 },
  }[size] || { size: 32, borderRadius: 16, fontSize: 12 };

  return (
    <View
      style={[
        styles.badge,
        {
          width: badgeSize.size,
          height: badgeSize.size,
          borderRadius: badgeSize.borderRadius,
        },
      ]}
    >
      <Text
        style={[
          styles.initial,
          { fontSize: badgeSize.fontSize },
        ]}
      >
        {platform.initial}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    color: colors.text.primary,
    fontWeight: '700',
  },
});

export default PlatformBadge;
