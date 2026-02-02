/**
 * AppContent Component
 * Wraps the main app content with theme-aware styling
 */

import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from './context/ThemeContext';
import AppNavigator from './navigation/AppNavigator';

const AppContent = ({ onLayout }) => {
  const { colors, isDark, isLoading } = useTheme();

  if (isLoading) {
    return null;
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.background.primary }}
      onLayout={onLayout}
    >
      <AppNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
};

export default AppContent;
