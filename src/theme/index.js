/**
 * Theme System - StreamFinder
 * Export all theme tokens from a single import
 */

export { default as colors } from './colors';
export { default as typography, fonts, fontWeights } from './typography';
export { default as spacing, layout } from './spacing';
export { default as animations, easing, duration, spring, timing } from './animations';

// Default export with everything
import colors from './colors';
import typography, { fonts, fontWeights } from './typography';
import spacing, { layout } from './spacing';
import animations, { easing, duration, spring, timing } from './animations';

export default {
  colors,
  typography,
  fonts,
  fontWeights,
  spacing,
  layout,
  animations,
  easing,
  duration,
  spring,
  timing,
};
