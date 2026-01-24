/**
 * FilterChip Component
 * Chip-style filter button with active/inactive states
 */

import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { colors, typography, spacing, layout } from '../theme';

const FilterChip = ({ label, active, onPress }) => {
  return (
    <Pressable
      style={[
        styles.chip,
        active && styles.chipActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          typography.caption,
          styles.chipText,
          active && styles.chipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    height: 36,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.tertiary,
    borderRadius: layout.borderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  chipActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
    // Glow effect
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  chipText: {
    color: colors.text.secondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.text.inverse,
  },
});

export default FilterChip;
