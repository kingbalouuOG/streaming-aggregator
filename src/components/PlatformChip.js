/**
 * PlatformChip Component
 * Informational chip showing platform availability
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, layout } from '../theme';
import GlassContainer from './GlassContainer';

const PlatformChip = ({ name }) => {
  return (
    <GlassContainer
      style={styles.container}
      borderRadius={layout.borderRadius.pill}
    >
      <Text style={[typography.caption, styles.name]}>{name}</Text>
    </GlassContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.glass.light,
  },
  name: {
    color: colors.text.primary,
    fontWeight: '600',
  },
});

export default PlatformChip;
