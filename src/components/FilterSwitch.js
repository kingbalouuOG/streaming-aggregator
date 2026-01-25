/**
 * FilterSwitch Component
 * Segmented control for filter options (e.g., cost filter: All/Free/Paid)
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, typography, spacing, layout } from '../theme';
import GlassContainer from './GlassContainer';

const FilterSwitch = ({ options, selectedKey, onSelect }) => {
  return (
    <GlassContainer
      style={styles.container}
      borderRadius={layout.borderRadius.pill}
      borderWidth={1}
    >
      <View style={styles.segmentRow}>
        {options.map((option) => {
          const isSelected = option.key === selectedKey;
          return (
            <Pressable
              key={option.key}
              style={[
                styles.segment,
                isSelected && styles.segmentSelected,
              ]}
              onPress={() => onSelect(option.key)}
            >
              <Text
                style={[
                  typography.caption,
                  styles.segmentText,
                  isSelected && styles.segmentTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </GlassContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.tertiary,
    padding: spacing.xs,
  },
  segmentRow: {
    flexDirection: 'row',
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: layout.borderRadius.pill - spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: colors.accent.primary,
    // Glow effect
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  segmentText: {
    color: colors.text.secondary,
    fontWeight: '600',
  },
  segmentTextSelected: {
    color: colors.text.inverse,
  },
});

export default FilterSwitch;
