/**
 * CategoryFilter Component
 *
 * Horizontal scrolling category pills with filter button
 * Pixel-perfect match to web design
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { CategoryFilterProps } from '../types';
import { layout } from '../theme/spacing';

// ─────────────────────────────────────────────────────────────
// Animated Pressable
// ─────────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─────────────────────────────────────────────────────────────
// Category Pill Component
// ─────────────────────────────────────────────────────────────

interface CategoryPillProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const CategoryPill: React.FC<CategoryPillProps> = ({ label, isActive, onPress }) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.pill,
        animatedStyle,
        {
          backgroundColor: isActive ? colors.accent.primary : colors.background.tertiary,
          borderColor: isActive ? colors.accent.primary : colors.semantic?.borderSubtle || 'transparent',
        },
      ]}
    >
      <Text
        style={[
          styles.pillText,
          {
            color: isActive ? '#FFFFFF' : colors.text.secondary,
          },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  onFilterPress,
  hasActiveFilters = false,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => (
          <CategoryPill
            key={category}
            label={category}
            isActive={category === activeCategory}
            onPress={() => onCategoryChange(category)}
          />
        ))}
      </ScrollView>

      {/* Filter button */}
      {onFilterPress && (
        <Pressable
          onPress={onFilterPress}
          style={[
            styles.filterButton,
            {
              backgroundColor: colors.background.tertiary,
              borderColor: colors.semantic?.borderSubtle || 'transparent',
            },
          ]}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={colors.text.secondary}
          />
          {hasActiveFilters && (
            <View
              style={[
                styles.filterBadge,
                { backgroundColor: colors.accent.primary },
              ]}
            />
          )}
        </Pressable>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 12,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default CategoryFilter;
