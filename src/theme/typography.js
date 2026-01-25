/**
 * Typography System - StreamFinder
 * Based on DESIGN_SYSTEM.md specifications
 */

import colors from './colors';

// Font families - Satoshi custom font
export const fonts = {
  light: 'Satoshi-Light',
  regular: 'Satoshi-Regular',
  medium: 'Satoshi-Medium',
};

// Font weights
export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// Type scale
export const typography = {
  // Headings
  h1: {
    fontFamily: fonts.medium,
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: 0.37,
    color: colors.text.primary,
  },

  h2: {
    fontFamily: fonts.medium,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0.36,
    color: colors.text.primary,
  },

  h3: {
    fontFamily: fonts.medium,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0.35,
    color: colors.text.primary,
  },

  h4: {
    fontFamily: fonts.medium,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: 0.38,
    color: colors.text.primary,
  },

  // Body
  body: {
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: colors.text.secondary,
  },

  bodyBold: {
    fontFamily: fonts.medium,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: colors.text.primary,
  },

  // UI Elements
  button: {
    fontFamily: fonts.medium,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: colors.text.primary,
  },

  caption: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: colors.text.secondary,
  },

  captionBold: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: colors.text.primary,
  },

  metadata: {
    fontFamily: fonts.light,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.08,
    color: colors.text.tertiary,
  },
};

export default typography;
