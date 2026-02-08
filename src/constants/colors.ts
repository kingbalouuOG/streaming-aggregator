/**
 * StreamingAggregator - Color System
 *
 * Pixel-perfect color tokens from the web design.
 * Primary accent: #e85d25 (orange)
 */

import { ServiceType, ThemeColors } from '../types';

// ─────────────────────────────────────────────────────────────
// Platform Colors
// ─────────────────────────────────────────────────────────────

export const platformColors: Record<ServiceType, string> = {
  netflix: '#E50914',
  prime: '#00A8E1',
  apple: '#374151',
  disney: '#113CCF',
  hbo: '#5C16C5',
  paramount: '#1E3A8A',
  hulu: '#1CE783',
  crunchyroll: '#F47521',
};

// ─────────────────────────────────────────────────────────────
// Dark Theme (Default)
// ─────────────────────────────────────────────────────────────

export const darkColors: ThemeColors = {
  // Core backgrounds
  background: '#0a0a0f',
  backgroundSecondary: '#111118',
  backgroundTertiary: '#161620',
  card: '#161620',

  // Text
  foreground: '#f0f0f5',
  mutedForeground: '#8888a0',

  // Accent colors
  primary: '#e85d25',
  primaryForeground: '#ffffff',
  secondary: '#1e1e2a',

  // Semantic colors
  destructive: '#d4183d',
  success: '#30D158',
  warning: '#FFD60A',

  // Borders & Overlays
  border: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.60)',
  overlaySubtle: 'rgba(255, 255, 255, 0.06)',

  // Platform colors
  platforms: platformColors,

  // Glass effects
  glass: 'rgba(255, 255, 255, 0.05)',
  glassMedium: 'rgba(255, 255, 255, 0.10)',
  glassHeavy: 'rgba(255, 255, 255, 0.15)',
};

// ─────────────────────────────────────────────────────────────
// Light Theme
// ─────────────────────────────────────────────────────────────

export const lightColors: ThemeColors = {
  // Core backgrounds
  background: '#f5f4f1',
  backgroundSecondary: '#ffffff',
  backgroundTertiary: '#ebe8e3',
  card: '#ffffff',

  // Text
  foreground: '#1a1a2e',
  mutedForeground: '#6b6b80',

  // Accent colors (primary stays same)
  primary: '#e85d25',
  primaryForeground: '#ffffff',
  secondary: '#ebe8e3',

  // Semantic colors
  destructive: '#d4183d',
  success: '#30D158',
  warning: '#FFD60A',

  // Borders & Overlays
  border: 'rgba(0, 0, 0, 0.08)',
  borderSubtle: 'rgba(0, 0, 0, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.30)',
  overlaySubtle: 'rgba(0, 0, 0, 0.04)',

  // Platform colors (same across themes)
  platforms: platformColors,

  // Glass effects
  glass: 'rgba(0, 0, 0, 0.03)',
  glassMedium: 'rgba(0, 0, 0, 0.06)',
  glassHeavy: 'rgba(0, 0, 0, 0.10)',
};

// ─────────────────────────────────────────────────────────────
// Extended Semantic Tokens
// ─────────────────────────────────────────────────────────────

export const semanticTokens = {
  dark: {
    navBackground: 'rgba(13, 13, 20, 0.95)',
    surfaceElevated: '#111118',
    heroGradient: '10, 10, 15', // For rgba()
    shimmer: 'rgba(255, 255, 255, 0.04)',
    dragHandle: 'rgba(255, 255, 255, 0.20)',
    sliderTrack: 'rgba(255, 255, 255, 0.10)',
    checkBorder: 'rgba(255, 255, 255, 0.15)',
    toastBackground: 'rgba(30, 30, 40, 0.95)',
    toastBorder: 'rgba(255, 255, 255, 0.08)',
    toastText: '#ffffff',
  },
  light: {
    navBackground: 'rgba(255, 255, 255, 0.95)',
    surfaceElevated: '#ffffff',
    heroGradient: '26, 26, 46',
    shimmer: 'rgba(0, 0, 0, 0.05)',
    dragHandle: 'rgba(0, 0, 0, 0.15)',
    sliderTrack: 'rgba(0, 0, 0, 0.10)',
    checkBorder: 'rgba(0, 0, 0, 0.15)',
    toastBackground: 'rgba(255, 255, 255, 0.95)',
    toastBorder: 'rgba(0, 0, 0, 0.08)',
    toastText: '#1a1a2e',
  },
} as const;

// ─────────────────────────────────────────────────────────────
// Design Constants
// ─────────────────────────────────────────────────────────────

export const radius = {
  sm: 6, // 0.375rem
  md: 8, // 0.5rem
  lg: 10, // 0.625rem (--radius)
  xl: 14, // 0.875rem
  '2xl': 16, // 1rem
  '3xl': 24, // 1.5rem
  full: 9999,
} as const;

// ─────────────────────────────────────────────────────────────
// Legacy Export (backward compatibility)
// ─────────────────────────────────────────────────────────────

export const colors = {
  // Backgrounds (using dark theme as default)
  background: {
    primary: darkColors.background,
    secondary: darkColors.backgroundSecondary,
    tertiary: darkColors.backgroundTertiary,
    glass: darkColors.glass,
  },

  // Text
  text: {
    primary: darkColors.foreground,
    secondary: darkColors.mutedForeground,
    tertiary: '#666666',
    inverse: '#000000',
  },

  // Accent Colors (updated to new orange primary)
  accent: {
    primary: darkColors.primary, // #e85d25 (NEW)
    secondary: '#00D9FF',
    success: darkColors.success,
    warning: darkColors.warning,
    error: darkColors.destructive,
  },

  // Platform Specific
  platforms: platformColors,

  // Glass Effects
  glass: {
    light: darkColors.glass,
    medium: darkColors.glassMedium,
    heavy: darkColors.glassHeavy,
    border: 'rgba(255, 255, 255, 0.15)',
  },

  // Overlays
  overlay: {
    light: 'rgba(0, 0, 0, 0.3)',
    medium: darkColors.overlay,
    heavy: 'rgba(0, 0, 0, 0.85)',
  },
};

export default colors;
