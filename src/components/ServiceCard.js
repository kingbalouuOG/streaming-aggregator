/**
 * ServiceCard Component
 * Multi-select card for streaming service selection in filters
 */

import React from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import { colors, typography, spacing, layout } from '../theme';
import GlassContainer from './GlassContainer';

const ServiceCard = ({ platformId, name, color, selected, onPress }) => {
  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <GlassContainer
        style={[
          styles.card,
          selected && styles.cardSelected,
        ]}
        borderRadius={layout.borderRadius.large}
        borderWidth={selected ? 2 : 1}
      >
        <View style={[styles.colorIndicator, { backgroundColor: color }]} />
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
      </GlassContainer>
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
    minHeight: 70,
    backgroundColor: colors.background.tertiary,
  },
  cardSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.glass.medium,
    // Glow effect
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  colorIndicator: {
    width: 32,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  name: {
    color: colors.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  nameSelected: {
    color: colors.text.primary,
  },
});

export default ServiceCard;
