/**
 * ErrorMessage Component
 * Displays error messages with retry functionality
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, layout } from '../theme';
import GlassContainer from './GlassContainer';
import { getUserMessage } from '../utils/errorHandler';

const ErrorMessage = ({ error, onRetry, style }) => {
  if (!error) return null;

  const { title, message, action } = getUserMessage(error);

  return (
    <View style={[styles.container, style]}>
      <GlassContainer style={styles.card} borderRadius={layout.borderRadius.medium}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={colors.accent.error}
          style={styles.icon}
        />
        <Text style={[typography.h4, styles.title]}>{title}</Text>
        <Text style={[typography.body, styles.message]}>{message}</Text>

        {onRetry && action === 'Retry' && (
          <Pressable style={styles.button} onPress={onRetry}>
            <Ionicons name="refresh" size={20} color={colors.text.primary} />
            <Text style={[typography.button, styles.buttonText]}>Try Again</Text>
          </Pressable>
        )}
      </GlassContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  card: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  icon: {
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: 'center',
    color: colors.text.primary,
  },
  message: {
    marginBottom: spacing.lg,
    textAlign: 'center',
    color: colors.text.secondary,
    lineHeight: 22,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 44,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.accent.primary,
    borderRadius: layout.borderRadius.medium,
  },
  buttonText: {
    color: colors.text.primary,
  },
});

export default ErrorMessage;
