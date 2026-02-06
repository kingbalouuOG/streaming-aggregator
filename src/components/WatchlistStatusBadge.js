/**
 * WatchlistStatusBadge Component
 * Small badge showing watchlist status (Want to Watch / Watched)
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, typography } from '../theme';

const WatchlistStatusBadge = ({
  status,
  size = 'small',
  showLabel = false,
  style,
}) => {
  const { colors } = useTheme();

  if (!status) return null;

  const isWatched = status === 'watched';

  const sizes = {
    small: { icon: 12, badge: 20, fontSize: 10 },
    medium: { icon: 14, badge: 24, fontSize: 11 },
    large: { icon: 16, badge: 28, fontSize: 12 },
  };

  const currentSize = sizes[size] || sizes.small;

  const badgeConfig = {
    want_to_watch: {
      icon: 'bookmark',
      color: colors.accent.primary,
      label: 'Want to Watch',
    },
    watched: {
      icon: 'checkmark-circle',
      color: colors.accent.success,
      label: 'Watched',
    },
  };

  const config = badgeConfig[status];

  if (!config) return null;

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: config.color,
            width: showLabel ? 'auto' : currentSize.badge,
            height: currentSize.badge,
            paddingHorizontal: showLabel ? spacing.sm : 0,
          },
        ]}
      >
        <Ionicons
          name={config.icon}
          size={currentSize.icon}
          color="#FFFFFF"
        />
        {showLabel && (
          <Text
            style={[
              styles.label,
              { fontSize: currentSize.fontSize },
            ]}
          >
            {config.label}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default memo(WatchlistStatusBadge);
