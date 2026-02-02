/**
 * Theme Context - StreamFinder
 * Provides theme state and toggle functionality throughout the app
 */

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme, darkTheme, lightTheme } from '../theme/themes';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = '@app_theme_preference';

/**
 * ThemeProvider Component
 * Wraps the app to provide theme state
 */
export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState(systemColorScheme || 'dark');
  const [themePreference, setThemePreference] = useState(null); // null = system, 'light'/'dark' = manual
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedPreference) {
          const pref = JSON.parse(savedPreference);
          setThemePreference(pref.preference);
          setTheme(pref.preference || systemColorScheme || 'dark');
        } else {
          setTheme(systemColorScheme || 'dark');
          setThemePreference(null);
        }
      } catch (error) {
        console.error('[Theme] Error loading theme preference:', error);
        setTheme(systemColorScheme || 'dark');
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, [systemColorScheme]);

  // Update theme when system preference changes (if not manually overridden)
  useEffect(() => {
    if (themePreference === null && systemColorScheme) {
      setTheme(systemColorScheme);
    }
  }, [systemColorScheme, themePreference]);

  const toggleTheme = useCallback(async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setThemePreference(newTheme);

    // Persist preference
    try {
      await AsyncStorage.setItem(
        THEME_STORAGE_KEY,
        JSON.stringify({ preference: newTheme })
      );
    } catch (error) {
      console.error('[Theme] Error saving theme preference:', error);
    }
  }, [theme]);

  const setSystemPreference = useCallback(async () => {
    setThemePreference(null);
    setTheme(systemColorScheme || 'dark');

    // Clear preference to use system
    try {
      await AsyncStorage.removeItem(THEME_STORAGE_KEY);
    } catch (error) {
      console.error('[Theme] Error clearing theme preference:', error);
    }
  }, [systemColorScheme]);

  const colors = getTheme(theme);

  const value = {
    theme,
    colors,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggleTheme,
    setSystemPreference,
    themePreference,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * useTheme Hook
 * Access theme state and functions throughout the app
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
