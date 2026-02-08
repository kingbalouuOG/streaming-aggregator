/**
 * SwipeableCard Component
 *
 * Swipeable list item for watchlist with reveal actions
 * Uses react-native-gesture-handler and reanimated for smooth 60fps
 */

import React, { memo, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SwipeableCardProps, ContentItem } from '../types';
import { ServiceBadgeRow } from './ServiceBadge';
import { layout } from '../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HEIGHT = 100;
const ACTION_WIDTH = 140;
const SWIPE_THRESHOLD = 70;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

const SwipeableCardComponent: React.FC<SwipeableCardProps> = ({
  item,
  onPress,
  onDelete,
  onMarkWatched,
  onMoveToWantToWatch,
  isWatched = false,
}) => {
  const { colors } = useTheme();
  const translateX = useSharedValue(0);

  // Memoized pan gesture for swipe
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .onUpdate((event) => {
          // Only allow swipe left (negative values)
          translateX.value = Math.max(-ACTION_WIDTH, Math.min(0, event.translationX));
        })
        .onEnd((event) => {
          const shouldOpen =
            translateX.value < -SWIPE_THRESHOLD ||
            (translateX.value < -30 && Math.abs(event.velocityX) > 500);

          translateX.value = withSpring(shouldOpen ? -ACTION_WIDTH : 0, {
            damping: 25,
            stiffness: 350,
          });
        }),
    [translateX]
  );

  // Animated style for card translation
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Handle action button press - memoized
  const handleAction = useCallback((action: () => void) => {
    translateX.value = withSpring(0, { damping: 25, stiffness: 350 });
    action();
  }, [translateX]);

  return (
    <View style={styles.container}>
      {/* Action buttons behind card */}
      <View style={styles.actionsContainer}>
        {isWatched ? (
          // Move to Want to Watch
          <Pressable
            onPress={() => onMoveToWantToWatch && handleAction(() => onMoveToWantToWatch(item.id))}
            style={[styles.actionButton, { backgroundColor: colors.accent.primary }]}
          >
            <Ionicons name="bookmark-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionText}>Want</Text>
          </Pressable>
        ) : (
          // Mark as Watched
          <Pressable
            onPress={() => onMarkWatched && handleAction(() => onMarkWatched(item.id))}
            style={[styles.actionButton, { backgroundColor: colors.accent.success }]}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionText}>Watched</Text>
          </Pressable>
        )}

        {/* Delete button */}
        <Pressable
          onPress={() => onDelete && handleAction(() => onDelete(item.id))}
          style={[styles.actionButton, { backgroundColor: colors.accent.error }]}
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          <Text style={styles.actionText}>Remove</Text>
        </Pressable>
      </View>

      {/* Swipeable card foreground */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, cardAnimatedStyle]}>
          <Pressable
            onPress={() => onPress?.(item)}
            style={[
              styles.cardInner,
              {
                backgroundColor: colors.card.background,
                borderColor: colors.semantic?.borderSubtle || 'transparent',
              },
            ]}
          >
            {/* Thumbnail */}
            <Image
              source={{ uri: item.image }}
              style={styles.thumbnail}
              resizeMode="cover"
            />

            {/* Content */}
            <View style={styles.cardContent}>
              <Text
                style={[styles.title, { color: colors.text.primary }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>

              <View style={styles.metaRow}>
                {item.year && (
                  <Text style={[styles.year, { color: colors.text.secondary }]}>
                    {item.year}
                  </Text>
                )}
                {item.rating && (
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={[styles.rating, { color: colors.text.secondary }]}>
                      {item.rating.toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Service badges */}
              <ServiceBadgeRow services={item.services} size="sm" maxDisplay={3} />
            </View>

            {/* Watched overlay */}
            {isWatched && (
              <View style={styles.watchedOverlay}>
                <Ionicons name="checkmark-circle" size={24} color={colors.accent.success} />
              </View>
            )}
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    height: CARD_HEIGHT,
    marginBottom: 12,
    marginHorizontal: layout.screenPadding,
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    flex: 1,
  },
  cardInner: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: layout.borderRadius.large,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 80,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  year: {
    fontSize: 13,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 13,
  },
  watchedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

// ─────────────────────────────────────────────────────────────
// Memoized Export
// ─────────────────────────────────────────────────────────────

export const SwipeableCard = memo(SwipeableCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.image === nextProps.item.image &&
    prevProps.isWatched === nextProps.isWatched
  );
});

export default SwipeableCard;
