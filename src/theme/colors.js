/**
 * Color System - StreamFinder
 * Based on DESIGN_SYSTEM.md specifications
 */

export const colors = {
  // Backgrounds
  background: {
    primary: '#000000',      // Pure black for OLED
    secondary: '#121212',    // Elevated surfaces
    tertiary: '#1E1E1E',     // Cards and containers
    glass: 'rgba(255, 255, 255, 0.05)',  // Glass morphism overlay
  },

  // Text
  text: {
    primary: '#FFFFFF',      // Main headings, important text
    secondary: '#B3B3B3',    // Body text, metadata
    tertiary: '#666666',     // Hints, disabled states
    inverse: '#000000',      // Text on light backgrounds
  },

  // Accent Colors (Bold pops)
  accent: {
    primary: '#46ff33',      // Neon green - primary actions, highlights
    secondary: '#00D9FF',    // Bright cyan - links, secondary actions
    success: '#30D158',      // Apple green - confirmations
    warning: '#FFD60A',      // Amber - alerts
    error: '#FF453A',        // Red - errors
  },

  // Platform Specific
  platforms: {
    netflix: '#E50914',
    amazon: '#00A8E1',
    apple: '#000000',
    disney: '#113CCF',
    bbc: '#FF0000',
    nowTV: '#00E0FF',
    itvx: '#000000',
    channel4: '#0095D9',
    paramount: '#0064FF',
    skyGo: '#0072C9',
  },

  // Glass Effects
  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.15)',
    heavy: 'rgba(255, 255, 255, 0.2)',
    border: 'rgba(255, 255, 255, 0.15)',
  },

  // Overlays
  overlay: {
    light: 'rgba(0, 0, 0, 0.3)',
    medium: 'rgba(0, 0, 0, 0.6)',
    heavy: 'rgba(0, 0, 0, 0.85)',
  },
};

export default colors;
