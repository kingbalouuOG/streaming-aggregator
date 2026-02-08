/**
 * Spacing System - StreamingAggregator
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

// Layout constants
export const layout = {
  // Screen padding (horizontal)
  screenPadding: spacing.lg,  // 16px

  // Card padding
  cardPadding: spacing.lg,    // 16px

  // Section spacing
  sectionSpacing: spacing.xl, // 24px

  // Content grid gap (2 columns)
  gridGap: spacing.md,        // 12px

  // Border radius (updated from web design)
  borderRadius: {
    small: 6,     // --radius-sm
    medium: 8,    // --radius-md
    large: 10,    // --radius (0.625rem)
    xl: 14,       // --radius-xl
    pill: 20,
    circle: 9999,
  },
} as const;

export default spacing;
