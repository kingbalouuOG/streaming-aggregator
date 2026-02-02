/**
 * AppNavigator - Main navigation structure
 * Switches between OnboardingStack and MainTabs based on onboarding completion
 */

import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, typography } from '../theme';
import { hasCompletedOnboarding } from '../storage/userPreferences';

// Onboarding Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LocationScreen from '../screens/LocationScreen';
import PlatformsScreen from '../screens/PlatformsScreen';
import GenrePreferencesScreen from '../screens/GenrePreferencesScreen';

// Main App Screens
import HomeScreen from '../screens/HomeScreen';
import BrowseScreen from '../screens/BrowseScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DetailScreen from '../screens/DetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Create navigation theme based on current theme
const getNavigationTheme = (isDark, colors) => ({
  dark: isDark,
  colors: {
    primary: colors.accent.primary,
    background: colors.background.primary,
    card: colors.background.secondary,
    text: colors.text.primary,
    border: colors.glass.border,
    notification: colors.accent.primary,
  },
  fonts: Platform.select({
    ios: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '600' },
      heavy: { fontFamily: 'System', fontWeight: '700' },
    },
    android: {
      regular: { fontFamily: 'sans-serif', fontWeight: 'normal' },
      medium: { fontFamily: 'sans-serif-medium', fontWeight: 'normal' },
      bold: { fontFamily: 'sans-serif', fontWeight: 'bold' },
      heavy: { fontFamily: 'sans-serif', fontWeight: 'bold' },
    },
    default: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '600' },
      heavy: { fontFamily: 'System', fontWeight: '700' },
    },
  }),
});

// Glass header styling - now a function
const getGlassHeaderOptions = (colors) => ({
  headerStyle: {
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  headerTintColor: colors.text.primary,
  headerTitleStyle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerShadowVisible: false,
  // Explicitly set these to avoid type casting issues
  headerShown: true,
  gestureEnabled: true,
});

// Onboarding Stack Navigator
const OnboardingStack = () => {
  const { colors } = useTheme();
  const glassHeaderOptions = getGlassHeaderOptions(colors);

  return (
    <Stack.Navigator
      screenOptions={{
        ...glassHeaderOptions,
        headerShown: false, // Hide header for onboarding screens
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Location" component={LocationScreen} />
      <Stack.Screen name="Platforms" component={PlatformsScreen} />
      <Stack.Screen name="GenrePreferences" component={GenrePreferencesScreen} />
    </Stack.Navigator>
  );
};

// Home Tab Stack Navigator
const HomeStack = () => {
  const { colors } = useTheme();
  const glassHeaderOptions = getGlassHeaderOptions(colors);

  return (
    <Stack.Navigator screenOptions={glassHeaderOptions}>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Detail"
        component={DetailScreen}
        options={{ title: 'Details' }}
      />
    </Stack.Navigator>
  );
};

// Browse Tab Stack Navigator
const BrowseStack = () => {
  const { colors } = useTheme();
  const glassHeaderOptions = getGlassHeaderOptions(colors);

  return (
    <Stack.Navigator screenOptions={glassHeaderOptions}>
      <Stack.Screen
        name="BrowseMain"
        component={BrowseScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Detail"
        component={DetailScreen}
        options={{ title: 'Details' }}
      />
    </Stack.Navigator>
  );
};

// Profile Tab Stack Navigator
const ProfileStack = () => {
  const { colors } = useTheme();
  const glassHeaderOptions = getGlassHeaderOptions(colors);

  return (
    <Stack.Navigator screenOptions={glassHeaderOptions}>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
};

// Main Tabs Navigator
const MainTabs = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 70 + Math.max(insets.bottom, 0),
          backgroundColor: colors.background.secondary,
          borderTopWidth: 1,
          borderTopColor: colors.glass.border,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          paddingHorizontal: 20,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.accent.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'BrowseTab') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="BrowseTab"
        component={BrowseStack}
        options={{ title: 'Browse' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Root Navigator - Switches between Onboarding and Main Tabs
const AppNavigator = () => {
  const { colors, isDark } = useTheme();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await hasCompletedOnboarding();
      setIsOnboardingComplete(completed);
    } catch (error) {
      console.error('[AppNavigator] Error checking onboarding status:', error);
      setIsOnboardingComplete(false);
    }
  };

  // Show loading indicator while checking onboarding status
  if (isOnboardingComplete === null) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  const navigationTheme = getNavigationTheme(isDark, colors);

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={isOnboardingComplete ? 'Main' : 'Onboarding'}
      >
        <Stack.Screen name="Onboarding" component={OnboardingStack} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;
