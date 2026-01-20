/**
 * SearchBar Component
 * Glass-styled search input with icon
 */

import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, layout } from '../theme';
import GlassContainer from './GlassContainer';

const SearchBar = ({ value, onChangeText, placeholder = 'Search...', onClear }) => {
  return (
    <GlassContainer
      style={styles.container}
      borderRadius={layout.borderRadius.medium}
    >
      <View style={styles.innerContainer}>
        <Ionicons
          name="search"
          size={20}
          color={colors.text.tertiary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[typography.body, styles.input]}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <Pressable onPress={onClear} style={styles.clearButton}>
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.text.tertiary}
            />
          </Pressable>
        )}
      </View>
    </GlassContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    minHeight: 24,
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});

export default SearchBar;
