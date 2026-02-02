/**
 * ProfileAvatar Component
 * Displays user initials in a circular badge
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';

const ProfileAvatar = ({ name, size = 80 }) => {
  const getInitials = (fullName) => {
    if (!fullName || typeof fullName !== 'string') return '?';

    const names = fullName.trim().split(' ').filter(n => n.length > 0);
    if (names.length === 0) return '?';
    if (names.length === 1) return names[0].charAt(0).toUpperCase();

    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);
  const fontSize = size * 0.4;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  initials: {
    color: colors.background.primary,
    fontWeight: '700',
  },
});

export default ProfileAvatar;
