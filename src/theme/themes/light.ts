/**
 * Light Theme - StreamingAggregator
 *
 * Updated light theme with new orange accent (#e85d25)
 * Pixel-perfect match to web design
 */

import { Theme } from './dark';

export const lightTheme: Theme = {
  // Backgrounds (updated from web globals.css)
  background: {
    primary: '#f5f4f1',      // Web: --background (light)
    secondary: '#ffffff',    // Web: --surface-elevated (light)
    tertiary: '#ebe8e3',     // Web: --secondary (light)
    glass: 'rgba(0, 0, 0, 0.03)',
  },

  // Text
  text: {
    primary: '#1a1a2e',      // Web: --foreground (light)
    secondary: '#6b6b80',    // Web: --muted-foreground (light)
    tertiary: '#999999',
    inverse: '#ffffff',
  },

  // Accent Colors (orange primary consistent across themes)
  accent: {
    primary: '#e85d25',      // Web: --primary (same in light)
    primaryLight: '#f47521',
    secondary: '#ebe8e3',    // Web: --secondary (light)
    success: '#34C759',
    warning: '#FF9500',
    error: '#d4183d',        // Web: --destructive
  },

  // Platform Colors (same across themes)
  platforms: {
    netflix: '#E50914',
    amazon: '#00A8E1',
    prime: '#00A8E1',
    apple: '#374151',
    disney: '#113CCF',
    hbo: '#5C16C5',
    hulu: '#1CE783',
    paramount: '#1E3A8A',
    crunchyroll: '#F47521',
    bbc: '#FF0000',
    nowTV: '#00E0FF',
    itvx: '#000000',
    channel4: '#0095D9',
    skyGo: '#0072C9',
  },

  // Glass Effects
  glass: {
    light: 'rgba(0, 0, 0, 0.03)',
    medium: 'rgba(0, 0, 0, 0.06)',
    heavy: 'rgba(0, 0, 0, 0.10)',
    border: 'rgba(0, 0, 0, 0.08)',
  },

  // Overlays
  overlay: {
    light: 'rgba(0, 0, 0, 0.15)',
    medium: 'rgba(0, 0, 0, 0.35)',
    heavy: 'rgba(0, 0, 0, 0.6)',
  },

  // Component-specific
  card: {
    background: '#ffffff',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000000',
  },

  input: {
    background: '#ebe8e3',
    borderColor: 'rgba(0, 0, 0, 0.07)',
    textColor: '#1a1a2e',
    placeholderColor: '#6b6b80',
  },

  // Extended tokens from web design
  semantic: {
    navBackground: 'rgba(255, 255, 255, 0.95)',
    surfaceElevated: '#ffffff',
    border: 'rgba(0, 0, 0, 0.08)',
    borderSubtle: 'rgba(0, 0, 0, 0.06)',
    shimmer: 'rgba(0, 0, 0, 0.05)',
    dragHandle: 'rgba(0, 0, 0, 0.15)',
    sliderTrack: 'rgba(0, 0, 0, 0.10)',
    checkBorder: 'rgba(0, 0, 0, 0.15)',
  },
};

export default lightTheme;
