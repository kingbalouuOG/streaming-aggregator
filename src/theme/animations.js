/**
 * Animation System - StreamFinder
 * Based on DESIGN_SYSTEM.md specifications
 */

import { Easing } from 'react-native';

// Easing curves
export const easing = {
  // Standard easing for most animations
  standard: Easing.bezier(0.4, 0.0, 0.2, 1),

  // Decelerate (items entering)
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1),

  // Accelerate (items exiting)
  accelerate: Easing.bezier(0.4, 0.0, 1, 1),

  // Sharp (quick transitions)
  sharp: Easing.bezier(0.4, 0.0, 0.6, 1),
};

// Animation durations (in milliseconds)
export const duration = {
  fast: 150,      // Quick feedback
  normal: 250,    // Standard transitions
  slow: 350,      // Deliberate animations
};

// Spring animation config (for React Native Animated)
export const spring = {
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
};

// Timing animation config
export const timing = {
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
};

// Common animation presets
export const animations = {
  // Card press animation
  cardPress: {
    scale: 0.95,
    opacity: 0.8,
    duration: duration.fast,
  },

  // Button press animation
  buttonPress: {
    scale: 0.98,
    opacity: 0.8,
    duration: duration.fast,
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
};

export default {
  easing,
  duration,
  spring,
  timing,
  animations,
};
