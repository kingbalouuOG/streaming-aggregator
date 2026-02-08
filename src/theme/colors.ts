/**
 * Color System - StreamingAggregator
 *
 * Theme-aware through useTheme() hook
 * This file provides backward compatibility
 */

import { darkTheme, Theme } from './themes/dark';

// NOTE: Use useTheme() hook from context instead of importing colors directly
// Components should use: const { colors } = useTheme();

// Default to dark theme for backward compatibility
export const colors: Theme = darkTheme;

export default colors;
export type { Theme };
