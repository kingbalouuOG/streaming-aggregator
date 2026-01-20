/**
 * GlassHeader Component
 * Header with glass blur effect, back button, and optional right action
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  StatusBar,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';

const HEADER_HEIGHT = 56;

const GlassHeader = ({ title, onBackPress, rightButton }) => {
  const headerContent = (
    <View style={styles.content}>
      {/* Back Button */}
      {onBackPress && (
        <Pressable
          style={styles.backButton}
          onPress={onBackPress}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
      )}

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={[typography.h4, styles.title]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* Right Action Button */}
      {rightButton ? (
        <View style={styles.rightButton}>{rightButton}</View>
      ) : (
        <View style={styles.rightButton} />
      )}
    </View>
  );

  // iOS: Use BlurView for native blur effect
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={80} tint="dark" style={styles.container}>
        {headerContent}
      </BlurView>
    );
  }

  // Android: Use semi-transparent background
  return (
    <View style={[styles.container, styles.androidContainer]}>
      {headerContent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: HEADER_HEIGHT,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  androidContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  rightButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});

export default GlassHeader;
