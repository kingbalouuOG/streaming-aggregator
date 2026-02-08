/**
 * Dark Theme - StreamingAggregator
 *
 * Updated dark theme with new orange accent (#e85d25)
 * Pixel-perfect match to web design
 */

export interface Theme {
  // Backgrounds
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    glass: string;
  };

  // Text
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };

  // Accent Colors
  accent: {
    primary: string;
    primaryLight: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
  };

  // Platform Colors
  platforms: Record<string, string>;

  // Glass Effects
  glass: {
    light: string;
    medium: string;
    heavy: string;
    border: string;
  };

  // Overlays
  overlay: {
    light: string;
    medium: string;
    heavy: string;
  };

  // Component-specific
  card: {
    background: string;
    borderColor: string;
    shadowColor: string;
  };

  input: {
    background: string;
    borderColor: string;
    textColor: string;
    placeholderColor: string;
  };

  // Extended tokens (from web design)
  semantic: {
    navBackground: string;
    surfaceElevated: string;
    border: string;
    borderSubtle: string;
    shimmer: string;
    dragHandle: string;
    sliderTrack: string;
    checkBorder: string;
  };
}

export const darkTheme: Theme = {
  // Backgrounds (updated from web globals.css)
  background: {
    primary: '#0a0a0f',      // Web: --background
    secondary: '#111118',    // Web: --surface-elevated
    tertiary: '#161620',     // Web: --card
    glass: 'rgba(255, 255, 255, 0.05)',
  },

  // Text
  text: {
    primary: '#f0f0f5',      // Web: --foreground
    secondary: '#8888a0',    // Web: --muted-foreground
    tertiary: '#666666',
    inverse: '#0a0a0f',
  },

  // Accent Colors (NEW orange primary from web)
  accent: {
    primary: '#e85d25',      // Web: --primary (NEW!)
    primaryLight: '#f47521',
    secondary: '#1e1e2a',    // Web: --secondary
    success: '#30D158',
    warning: '#FFD60A',
    error: '#d4183d',        // Web: --destructive
  },

  // Platform Colors
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
    light: 'rgba(255, 255, 255, 0.05)',
    medium: 'rgba(255, 255, 255, 0.10)',
    heavy: 'rgba(255, 255, 255, 0.15)',
    border: 'rgba(255, 255, 255, 0.08)',
  },

  // Overlays
  overlay: {
    light: 'rgba(0, 0, 0, 0.3)',
    medium: 'rgba(0, 0, 0, 0.6)',
    heavy: 'rgba(0, 0, 0, 0.85)',
  },

  // Component-specific
  card: {
    background: '#161620',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
  },

  input: {
    background: '#1e1e2a',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    textColor: '#f0f0f5',
    placeholderColor: '#8888a0',
  },

  // Extended tokens from web design
  semantic: {
    navBackground: 'rgba(13, 13, 20, 0.95)',
    surfaceElevated: '#111118',
    border: 'rgba(255, 255, 255, 0.08)',
    borderSubtle: 'rgba(255, 255, 255, 0.06)',
    shimmer: 'rgba(255, 255, 255, 0.04)',
    dragHandle: 'rgba(255, 255, 255, 0.20)',
    sliderTrack: 'rgba(255, 255, 255, 0.10)',
    checkBorder: 'rgba(255, 255, 255, 0.15)',
  },
};

export default darkTheme;
