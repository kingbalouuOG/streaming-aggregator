/**
 * StreamingAggregator - Spacing System
 *
 * Base unit: 4px - everything is multiples of 4 for perfect alignment
 */

export const spacing = {
  xs: 4,      // Tight spacing, icon padding
  sm: 8,      // Small gaps, chip padding
  md: 12,     // Default spacing between related elements
  lg: 16,     // Section spacing, card padding
  xl: 24,     // Large gaps, screen padding
  xxl: 32,    // Section headers, major spacing
  xxxl: 48,   // Screen top/bottom padding
} as const;

export type SpacingKey = keyof typeof spacing;
export type SpacingValue = typeof spacing[SpacingKey];
