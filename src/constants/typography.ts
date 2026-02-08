/**
 * StreamingAggregator - Typography System
 *
 * Font styles and text presets
 */

import { TextStyle } from 'react-native';
import { darkColors } from './colors';

// ─────────────────────────────────────────────────────────────
// Font Configuration
// ─────────────────────────────────────────────────────────────

export const fonts = {
  ios: 'SF Pro Display',
  android: 'Roboto',
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

// ─────────────────────────────────────────────────────────────
// Typography Presets
// ─────────────────────────────────────────────────────────────

export const typography: Record<string, TextStyle> = {
  // Headings
  h1: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 41,
    letterSpacing: 0.37,
    color: darkColors.foreground,
  },

  h2: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: 0.36,
    color: darkColors.foreground,
  },

  h3: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: 0.35,
    color: darkColors.foreground,
  },

  h4: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 25,
    letterSpacing: 0.38,
    color: darkColors.foreground,
  },

  // Body
  body: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: -0.41,
    color: darkColors.mutedForeground,
  },

  bodyBold: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: -0.41,
    color: darkColors.foreground,
  },

  // UI Elements
  button: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: -0.41,
    color: darkColors.foreground,
  },

  caption: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.24,
    color: darkColors.mutedForeground,
  },

  metadata: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: -0.08,
    color: darkColors.mutedForeground,
  },

  // Small text for badges, labels
  small: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: 0.5,
    color: darkColors.mutedForeground,
  },
};
