/**
 * EmptyState Component
 * Displays helpful empty state messages with optional actions
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, layout } from '../theme';

const EmptyState = ({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon} size={80} color={colors.text.tertiary} style={styles.icon} />
      <Text style={[typography.h3, styles.title]}>{title}</Text>
      <Text style={[typography.body, styles.message]}>{message}</Text>

      {actionLabel && onAction && (
        <Pressable style={styles.button} onPress={onAction}>
          <Text style={[typography.button, styles.buttonText]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
  },
  icon: {
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  title: {
    marginBottom: spacing.md,
    textAlign: 'center',
    color: colors.text.primary,
  },
  message: {
    marginBottom: spacing.xl,
    textAlign: 'center',
    color: colors.text.secondary,
    lineHeight: 24,
  },
  button: {
    height: 44,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.accent.primary,
    borderRadius: layout.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.text.primary,
  },
});

export default EmptyState;
