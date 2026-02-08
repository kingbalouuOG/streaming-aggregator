/**
 * ServiceBadge Component
 *
 * Colored circular badge for streaming platforms
 * Pixel-perfect match to web design
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ServiceType, ServiceBadgeProps } from '../types';

// ─────────────────────────────────────────────────────────────
// Service Configuration
// ─────────────────────────────────────────────────────────────

interface ServiceConfig {
  label: string;
  bgColor: string;
  textColor?: string;
}

const serviceConfig: Record<ServiceType, ServiceConfig> = {
  netflix: { label: 'N', bgColor: '#E50914' },
  prime: { label: 'P', bgColor: '#00A8E1' },
  disney: { label: 'D+', bgColor: '#113CCF' },
  hbo: { label: 'M', bgColor: '#5C16C5' },
  hulu: { label: 'H', bgColor: '#1CE783' },
  apple: { label: 'tv', bgColor: '#374151', textColor: 'rgba(255,255,255,0.6)' },
  paramount: { label: 'P+', bgColor: '#1E3A8A' },
  crunchyroll: { label: 'CR', bgColor: '#F47521' },
};

// Size configurations
const sizeConfig = {
  sm: {
    size: 20,
    fontSize: 9,
    fontWeight: '700' as const,
  },
  md: {
    size: 24,
    fontSize: 10,
    fontWeight: '700' as const,
  },
  lg: {
    size: 32,
    fontSize: 12,
    fontWeight: '700' as const,
  },
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const ServiceBadge: React.FC<ServiceBadgeProps> = ({
  service,
  size = 'sm',
}) => {
  const config = serviceConfig[service];
  const sizeStyles = sizeConfig[size];

  if (!config) {
    return null;
  }

  const containerStyle: ViewStyle = {
    width: sizeStyles.size,
    height: sizeStyles.size,
    borderRadius: sizeStyles.size / 2,
    backgroundColor: config.bgColor,
  };

  const textStyle: TextStyle = {
    fontSize: sizeStyles.fontSize,
    fontWeight: sizeStyles.fontWeight,
    color: config.textColor || '#FFFFFF',
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, textStyle]}>{config.label}</Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
});

// ─────────────────────────────────────────────────────────────
// Service Badge Row (for multiple badges)
// ─────────────────────────────────────────────────────────────

interface ServiceBadgeRowProps {
  services: ServiceType[];
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number;
  spacing?: number;
}

export const ServiceBadgeRow: React.FC<ServiceBadgeRowProps> = ({
  services,
  size = 'sm',
  maxDisplay = 4,
  spacing = -4,
}) => {
  const displayServices = services.slice(0, maxDisplay);

  return (
    <View style={styles.row}>
      {displayServices.map((service, index) => (
        <View
          key={service}
          style={[
            styles.badgeWrapper,
            { marginLeft: index > 0 ? spacing : 0, zIndex: displayServices.length - index },
          ]}
        >
          <ServiceBadge service={service} size={size} />
        </View>
      ))}
    </View>
  );
};

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeWrapper: {
    // Shadow for stacking effect
  },
});

Object.assign(styles, rowStyles);

export default ServiceBadge;
