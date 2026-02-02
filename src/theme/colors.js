/**
 * Color System - StreamFinder
 * Now theme-aware through useTheme() hook
 * This file is kept for backward compatibility
 */

// NOTE: Use useTheme() hook from context instead of importing colors directly
// Components should use: const { colors } = useTheme();
import { darkTheme } from './themes/dark';

// Default to dark theme for backward compatibility
export const colors = darkTheme;

export default colors;
