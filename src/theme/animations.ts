/**
 * Animation System - StreamingAggregator
 *
 * Animation presets and timing functions
 * Updated with new snappy spring configs from web design
 */

import { Easing } from 'react-native';

// ─────────────────────────────────────────────────────────────
// Easing Curves
// ─────────────────────────────────────────────────────────────

export const easing = {
  // Standard easing for most animations
  standard: Easing.bezier(0.4, 0.0, 0.2, 1),

  // Decelerate (items entering)
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1),

  // Accelerate (items exiting)
  accelerate: Easing.bezier(0.4, 0.0, 1, 1),

  // Sharp (quick transitions)
  sharp: Easing.bezier(0.4, 0.0, 0.6, 1),

  // Ease out quart (from Motion library)
  easeOutQuart: Easing.bezier(0.25, 0.46, 0.45, 0.94),
} as const;

// ─────────────────────────────────────────────────────────────
// Duration Constants
// ─────────────────────────────────────────────────────────────

export const duration = {
  instant: 100,   // Micro-interactions
  fast: 150,      // Quick feedback
  normal: 250,    // Standard transitions
  slow: 350,      // Deliberate animations
  slower: 500,    // Page transitions
} as const;

// ─────────────────────────────────────────────────────────────
// Spring Configurations
// ─────────────────────────────────────────────────────────────

export interface SpringConfig {
  tension: number;
  friction: number;
  useNativeDriver: boolean;
}

export const spring: Record<string, SpringConfig> = {
  // Standard spring
  standard: {
    tension: 100,
    friction: 7,
    useNativeDriver: true,
  },

  // Bouncy spring
  bouncy: {
    tension: 200,
    friction: 10,
    useNativeDriver: true,
  },

  // Gentle spring
  gentle: {
    tension: 50,
    friction: 7,
    useNativeDriver: true,
  },

  // NEW: Snappy spring (from web Motion library)
  // stiffness: 350, damping: 30
  snappy: {
    tension: 350,
    friction: 30,
    useNativeDriver: true,
  },

  // NEW: Card transition spring
  // stiffness: 350, damping: 25
  cardTransition: {
    tension: 350,
    friction: 25,
    useNativeDriver: true,
  },

  // NEW: Sheet/modal spring
  // stiffness: 300, damping: 30
  sheet: {
    tension: 300,
    friction: 30,
    useNativeDriver: true,
  },

  // NEW: Checkbox animation
  // stiffness: 400, damping: 15
  checkbox: {
    tension: 400,
    friction: 15,
    useNativeDriver: true,
  },
} as const;

// ─────────────────────────────────────────────────────────────
// Timing Configurations
// ─────────────────────────────────────────────────────────────

export interface TimingConfig {
  duration: number;
  easing: (value: number) => number;
  useNativeDriver: boolean;
}

export const timing: Record<string, TimingConfig> = {
  // Fast
  fast: {
    duration: duration.fast,
    easing: easing.standard,
    useNativeDriver: true,
  },

  // Normal
  normal: {
    duration: duration.normal,
    easing: easing.standard,
    useNativeDriver: true,
  },

  // Slow
  slow: {
    duration: duration.slow,
    easing: easing.standard,
    useNativeDriver: true,
  },

  // Fade in
  fadeIn: {
    duration: duration.normal,
    easing: easing.decelerate,
    useNativeDriver: true,
  },

  // Fade out
  fadeOut: {
    duration: duration.fast,
    easing: easing.accelerate,
    useNativeDriver: true,
  },
} as const;

// ─────────────────────────────────────────────────────────────
// Animation Presets
// ─────────────────────────────────────────────────────────────

export const animations = {
  // Card press animation
  cardPress: {
    scale: 0.95,
    opacity: 0.8,
    duration: duration.fast,
  },

  // Button press animation
  buttonPress: {
    scale: 0.97,
    opacity: 0.8,
    duration: duration.fast,
  },

  // NEW: Bookmark pulse animation (from web ContentCard)
  // scale: [1, 1.3, 0.9, 1.05, 1]
  bookmarkPulse: {
    keyframes: [1, 1.3, 0.9, 1.05, 1],
    duration: 400,
  },

  // NEW: Nav icon pulse (from web BottomNav)
  // scale: [1, 1.15, 1]
  navIconPulse: {
    keyframes: [1, 1.15, 1],
    duration: 300,
  },

  // NEW: Service badge toggle
  // scale: [1, 1.2, 0.95, 1]
  serviceBadgeToggle: {
    keyframes: [1, 1.2, 0.95, 1],
    duration: 350,
  },

  // NEW: Genre chip toggle
  // scale: [1, 1.1, 0.96, 1]
  genreChipToggle: {
    keyframes: [1, 1.1, 0.96, 1],
    duration: 300,
  },

  // Fade in animation
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: duration.normal,
  },

  // Fade out animation
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
    duration: duration.fast,
  },

  // Slide in from bottom
  slideInBottom: {
    from: { translateY: 50, opacity: 0 },
    to: { translateY: 0, opacity: 1 },
    duration: duration.normal,
  },

  // Slide out to bottom
  slideOutBottom: {
    from: { translateY: 0, opacity: 1 },
    to: { translateY: 50, opacity: 0 },
    duration: duration.fast,
  },

  // NEW: Page slide (from web OnboardingFlow)
  pageSlide: {
    enter: { translateX: 300, opacity: 0 },
    center: { translateX: 0, opacity: 1 },
    exit: { translateX: -300, opacity: 0 },
    duration: duration.normal,
  },
} as const;

export default {
  easing,
  duration,
  spring,
  timing,
  animations,
};
