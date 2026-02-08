/**
 * ContentRow Component
 *
 * Horizontal scrolling content carousel with section header
 * Used for "Popular on Your Services", "Highest Rated", etc.
 * Optimized with FlatList performance props
 */

import React, { memo, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ContentItem, ContentRowProps } from '../types';
import { layout } from '../theme/spacing';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const CARD_SIZES = {
  default: { width: 165, height: 240 },
  wide: { width: 200, height: 280 },
  compact: { width: 140, height: 200 },
} as const;

const ITEM_SPACING = 12;

// Memoized separator component
const ItemSeparator = memo(() => <View style={styles.separator} />);
ItemSeparator.displayName = 'ItemSeparator';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ContentRowInternalProps extends ContentRowProps {
  renderItem?: ListRenderItem<ContentItem>;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

const ContentRowComponent: React.FC<ContentRowInternalProps> = ({
  title,
  items,
  onItemSelect,
  onSeeAll,
  variant = 'default',
  renderItem,
}) => {
  const { colors } = useTheme();

  // Card dimensions based on variant
  const cardSize = CARD_SIZES[variant] || CARD_SIZES.default;

  // Memoized keyExtractor
  const keyExtractor = useCallback(
    (item: ContentItem) => `${item.type || 'content'}-${item.id}`,
    []
  );

  // getItemLayout for consistent item sizes (enables optimization)
  const getItemLayout = useCallback(
    (_data: ArrayLike<ContentItem> | null | undefined, index: number) => ({
      length: cardSize.width,
      offset: (cardSize.width + ITEM_SPACING) * index,
      index,
    }),
    [cardSize.width]
  );

  // Default render item (fallback)
  const defaultRenderItem: ListRenderItem<ContentItem> = useCallback(
    ({ item }) => (
      <Pressable
        onPress={() => onItemSelect?.(item)}
        style={[
          styles.card,
          {
            width: cardSize.width,
            height: cardSize.height,
            backgroundColor: colors.card.background,
            borderRadius: layout.borderRadius.large,
          },
        ]}
      >
        <View style={styles.cardImage} />
        <View style={styles.cardContent}>
          <Text
            style={[styles.cardTitle, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {item.year && (
            <Text style={[styles.cardYear, { color: colors.text.secondary }]}>
              {item.year}
            </Text>
          )}
        </View>
      </Pressable>
    ),
    [cardSize, colors, onItemSelect]
  );

  // Memoize the header to prevent re-renders
  const header = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {title}
        </Text>
        {onSeeAll && (
          <Pressable onPress={onSeeAll}>
            <Text style={[styles.seeAll, { color: colors.accent.primary }]}>
              See All
            </Text>
          </Pressable>
        )}
      </View>
    ),
    [title, onSeeAll, colors]
  );

  return (
    <View style={styles.container}>
      {header}

      <FlatList
        horizontal
        data={items}
        renderItem={renderItem || defaultRenderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
        // Performance optimizations
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews={true}
        // Prevent re-renders when parent changes
        extraData={undefined}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: layout.screenPadding,
  },
  separator: {
    width: ITEM_SPACING,
  },
  // Fallback card styles
  card: {
    overflow: 'hidden',
  },
  cardImage: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cardContent: {
    padding: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardYear: {
    fontSize: 12,
    marginTop: 2,
  },
});

// ─────────────────────────────────────────────────────────────
// Memoized Export
// ─────────────────────────────────────────────────────────────

export const ContentRow = memo(ContentRowComponent, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.title === nextProps.title &&
    prevProps.items === nextProps.items &&
    prevProps.variant === nextProps.variant &&
    prevProps.renderItem === nextProps.renderItem
  );
});

export default ContentRow;
