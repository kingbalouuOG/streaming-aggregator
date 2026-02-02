/**
 * Theme Getter Function
 * Returns the appropriate theme based on current scheme
 */

import { darkTheme } from './dark';
import { lightTheme } from './light';

export const getTheme = (scheme) => {
  return scheme === 'light' ? lightTheme : darkTheme;
};

export { darkTheme, lightTheme };
