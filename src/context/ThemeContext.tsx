/**
 * Theme Context - StreamingAggregator
 *
 * Provides theme state and toggle functionality throughout the app
 */

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
  useMemo,
  ReactNode,
} from 'react';
import { useColorScheme, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme, Theme, ThemeScheme } from '../theme/themes';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ThemePreference = ThemeScheme | null;

export interface ThemeContextValue {
  theme: ThemeScheme;
  resolvedTheme: ThemeScheme;
  colors: Theme;
  isDark: boolean;
  isLight: boolean;
  toggleTheme: () => Promise<void>;
  setTheme: (theme: ThemeScheme) => Promise<void>;
  setSystemPreference: () => Promise<void>;
  themePreference: ThemePreference;
  isLoading: boolean;
}

interface ThemeProviderProps {
  children: ReactNode;
}

interface StoredThemePreference {
  preference: ThemePreference;
}

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_preference';

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeScheme>(
    (systemColorScheme as ThemeScheme) || 'dark'
  );
  const [themePreference, setThemePreference] = useState<ThemePreference>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedPreference) {
          const pref: StoredThemePreference = JSON.parse(savedPreference);
          setThemePreference(pref.preference);
          setThemeState(pref.preference || (systemColorScheme as ThemeScheme) || 'dark');
        } else {
          setThemeState((systemColorScheme as ThemeScheme) || 'dark');
          setThemePreference(null);
        }
      } catch (error) {
        console.error('[Theme] Error loading theme preference:', error);
        setThemeState((systemColorScheme as ThemeScheme) || 'dark');
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, [systemColorScheme]);

  // Update theme when system preference changes (if not manually overridden)
  useEffect(() => {
    if (themePreference === null && systemColorScheme) {
      setThemeState(systemColorScheme as ThemeScheme);
    }
  }, [systemColorScheme, themePreference]);

  const toggleTheme = useCallback(async () => {
    const newTheme: ThemeScheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
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

  const setTheme = useCallback(async (newTheme: ThemeScheme) => {
    setThemeState(newTheme);
    setThemePreference(newTheme);

    try {
      await AsyncStorage.setItem(
        THEME_STORAGE_KEY,
        JSON.stringify({ preference: newTheme })
      );
    } catch (error) {
      console.error('[Theme] Error saving theme preference:', error);
    }
  }, []);

  const setSystemPreference = useCallback(async () => {
    setThemePreference(null);
    setThemeState((systemColorScheme as ThemeScheme) || 'dark');

    // Clear preference to use system
    try {
      await AsyncStorage.removeItem(THEME_STORAGE_KEY);
    } catch (error) {
      console.error('[Theme] Error clearing theme preference:', error);
    }
  }, [systemColorScheme]);

  const colors = useMemo(() => getTheme(theme), [theme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    resolvedTheme: theme,
    colors,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggleTheme,
    setTheme,
    setSystemPreference,
    themePreference,
    isLoading,
  }), [theme, colors, toggleTheme, setTheme, setSystemPreference, themePreference, isLoading]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
