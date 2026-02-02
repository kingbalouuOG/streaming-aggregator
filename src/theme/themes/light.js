/**
 * Light Theme - StreamFinder
 * Primary light theme with warm coral accent (#FF6B35)
 */

export const lightTheme = {
  // Backgrounds
  background: {
    primary: '#FFFFFF',      // Clean white
    secondary: '#F5F5F5',    // Off-white/card background
    tertiary: '#EEEEEE',     // Subtle elevation
    glass: 'rgba(0, 0, 0, 0.04)',  // Subtle glass overlay
  },

  // Text
  text: {
    primary: '#1A1A1A',      // Dark gray for readability (WCAG AAA)
    secondary: '#666666',    // Medium gray for body text
    tertiary: '#999999',     // Light gray for hints
    inverse: '#FFFFFF',      // White for dark backgrounds
  },

  // Accent Colors (Warm Coral)
  accent: {
    primary: '#FF6B35',      // Warm coral - primary actions, highlights
    primaryLight: '#FFB399', // Lighter coral for hover/secondary
    secondary: '#FFB84D',    // Warm gold - secondary actions
    success: '#34C759',      // Green - confirmations (darker for light theme)
    warning: '#FF9500',      // Orange - alerts (darker for light theme)
    error: '#FF3B30',        // Red - errors (darker for light theme)
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

  // Glass Effects (Stronger borders for light theme)
  glass: {
    light: 'rgba(0, 0, 0, 0.06)',
    medium: 'rgba(0, 0, 0, 0.08)',
    heavy: 'rgba(0, 0, 0, 0.1)',
    border: 'rgba(0, 0, 0, 0.12)',
  },

  // Overlays
  overlay: {
    light: 'rgba(0, 0, 0, 0.15)',
    medium: 'rgba(0, 0, 0, 0.35)',
    heavy: 'rgba(0, 0, 0, 0.6)',
  },

  // Component-specific
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(0, 0, 0, 0.12)',
    shadowColor: '#000000',
  },

  input: {
    background: 'rgba(0, 0, 0, 0.04)',
    borderColor: 'rgba(0, 0, 0, 0.12)',
    textColor: '#1A1A1A',
    placeholderColor: '#999999',
  },
};

export default lightTheme;
