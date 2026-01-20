/**
 * Spacing System - StreamFinder
 * Based on DESIGN_SYSTEM.md specifications
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
};

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

  // Border radius
  borderRadius: {
    small: 6,
    medium: 12,
    large: 16,
    pill: 20,
    circle: 999,
  },
};

export default spacing;
