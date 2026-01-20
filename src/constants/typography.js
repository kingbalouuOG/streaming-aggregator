import { Platform } from 'react-native';
import { colors } from './colors';

export const fonts = {
  ios: 'SF Pro Display',
  android: 'Roboto',
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const typography = {
  // Headings
  h1: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 41,
    letterSpacing: 0.37,
    color: colors.text.primary,
  },

  h2: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: 0.36,
    color: colors.text.primary,
  },

  h3: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: 0.35,
    color: colors.text.primary,
  },

  h4: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 25,
    letterSpacing: 0.38,
    color: colors.text.primary,
  },

  // Body
  body: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: -0.41,
    color: colors.text.secondary,
  },

  bodyBold: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: -0.41,
    color: colors.text.primary,
  },

  // UI Elements
  button: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: -0.41,
    color: colors.text.primary,
  },

  caption: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.24,
    color: colors.text.secondary,
  },

  metadata: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: -0.08,
    color: colors.text.tertiary,
  },
};
