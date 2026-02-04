/**
 * PlatformChip Component
 * Informational chip showing platform availability with optional cost label
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, layout } from '../theme';
import GlassContainer from './GlassContainer';

const PlatformChip = ({ name, costLabel = null }) => {
  return (
    <GlassContainer
      style={styles.container}
      borderRadius={layout.borderRadius.pill}
    >
      <View style={styles.content}>
        <Text style={[typography.caption, styles.name]}>{name}</Text>
        {costLabel && (
          <View style={styles.costBadge}>
            <Text style={styles.costText}>{costLabel}</Text>
          </View>
        )}
      </View>
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  costBadge: {
    backgroundColor: '#FFD60A',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
  costText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000000',
  },
});

export default PlatformChip;
