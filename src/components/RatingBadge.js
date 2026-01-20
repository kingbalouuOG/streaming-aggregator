/**
 * RatingBadge Component
 * Displays rating score with icon in glass container
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, layout } from '../theme';
import GlassContainer from './GlassContainer';

const RatingBadge = ({ type, score }) => {
  if (!score) return null;

  const isRT = type === 'rt';
  const icon = isRT ? 'nutrition' : 'star';
  const iconColor = isRT ? '#FA320A' : '#F5C518';
  const displayScore = isRT ? `${score}%` : score;

  return (
    <GlassContainer
      style={styles.container}
      borderRadius={layout.borderRadius.medium}
    >
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text style={[typography.captionBold, styles.score]}>{displayScore}</Text>
    </GlassContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  score: {
    color: colors.text.primary,
  },
});

export default RatingBadge;
