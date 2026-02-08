/**
 * Theme Getter Function
 * Returns the appropriate theme based on current scheme
 */

import { darkTheme, Theme } from './dark';
import { lightTheme } from './light';

export type ThemeScheme = 'light' | 'dark';

export const getTheme = (scheme: ThemeScheme): Theme => {
  return scheme === 'light' ? lightTheme : darkTheme;
};

export { darkTheme, lightTheme };
export type { Theme };
