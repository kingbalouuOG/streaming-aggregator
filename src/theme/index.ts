/**
 * Theme System - StreamingAggregator
 *
 * Export all theme tokens and hooks from a single import
 */

// Re-exports
export { default as colors, Theme } from './colors';
export { default as typography, fonts, fontWeights } from './typography';
export { default as spacing, layout } from './spacing';
export { default as animations, easing, duration, spring, timing } from './animations';
export { useTheme } from '../context/ThemeContext';
export { getTheme, darkTheme, lightTheme } from './themes';

// Types
export type { SpringConfig, TimingConfig } from './animations';
export type { SpacingKey } from './spacing';
export type { ThemeScheme } from './themes';

// Default export with everything
import colors from './colors';
import typography, { fonts, fontWeights } from './typography';
import spacing, { layout } from './spacing';
import animations, { easing, duration, spring, timing } from './animations';

const theme = {
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
} as const;

export default theme;
