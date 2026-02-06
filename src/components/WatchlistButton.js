/**
 * WatchlistButton Component
 * Primary action button for adding/managing watchlist items
 */

import React, { memo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, typography, layout } from '../theme';
import GlassContainer from './GlassContainer';
import {
  isInWatchlist,
  getWatchlistItem,
  addToWatchlist,
  removeFromWatchlist,
  setWatchlistStatus,
  setWatchlistRating,
} from '../storage/watchlist';
import { invalidateRecommendationCache } from '../storage/recommendations';

const WatchlistButton = ({
  itemId,
  itemType,
  metadata,
  size = 'large',
  variant = 'full', // 'full', 'icon', or 'compact'
  onStatusChange,
  style,
}) => {
  const { colors } = useTheme();
  const [watchlistItem, setWatchlistItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Load watchlist status on mount
  useEffect(() => {
    loadWatchlistStatus();
  }, [itemId, itemType]);

  const loadWatchlistStatus = async () => {
    try {
      setIsLoading(true);
      const item = await getWatchlistItem(itemId, itemType);
      setWatchlistItem(item);
    } catch (error) {
      console.error('[WatchlistButton] Error loading status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleAddToWatchlist = async (status = 'want_to_watch') => {
    try {
      setIsLoading(true);
      const item = await addToWatchlist(itemId, itemType, metadata, status);
      setWatchlistItem(item);
      await invalidateRecommendationCache();
      onStatusChange?.('added', item);
    } catch (error) {
      console.error('[WatchlistButton] Error adding to watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromWatchlist = async () => {
    try {
      setIsLoading(true);
      await removeFromWatchlist(itemId, itemType);
      setWatchlistItem(null);
      await invalidateRecommendationCache();
      onStatusChange?.('removed', null);
    } catch (error) {
      console.error('[WatchlistButton] Error removing from watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setIsLoading(true);
      const item = await setWatchlistStatus(itemId, itemType, newStatus);
      setWatchlistItem(item);
      await invalidateRecommendationCache();
      onStatusChange?.('updated', item);
    } catch (error) {
      console.error('[WatchlistButton] Error changing status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingChange = async (rating) => {
    try {
      setIsLoading(true);
      const item = await setWatchlistRating(itemId, itemType, rating);
      setWatchlistItem(item);
      await invalidateRecommendationCache();
      onStatusChange?.('rated', item);
    } catch (error) {
      console.error('[WatchlistButton] Error changing rating:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePress = () => {
    if (watchlistItem) {
      setShowPicker(true);
    } else {
      handleAddToWatchlist('want_to_watch');
    }
  };

  const isInList = watchlistItem !== null;
  const isWatched = watchlistItem?.status === 'watched';

  // Icon-only variant for overlay use
  if (variant === 'icon') {
    const getIconProps = () => {
      if (isLoading) {
        return { name: 'bookmark-outline', color: colors.text.tertiary };
      }
      if (!isInList) {
        return { name: 'bookmark-outline', color: colors.text.primary };
      }
      if (isWatched) {
        const ratingColor = watchlistItem.rating === 1 ? colors.accent.success :
                            watchlistItem.rating === -1 ? colors.accent.error : colors.accent.primary;
        return { name: 'checkmark-circle', color: ratingColor };
      }
      return { name: 'bookmark', color: colors.accent.primary };
    };

    const iconProps = getIconProps();

    return (
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isLoading}
        style={style}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <GlassContainer style={styles.iconButton} borderRadius={layout.borderRadius.circle}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : (
              <Ionicons name={iconProps.name} size={24} color={iconProps.color} />
            )}
          </GlassContainer>
        </Animated.View>
      </Pressable>
    );
  }

  // Compact variant - icon with short text for overlay use (direct toggle)
  if (variant === 'compact') {
    const getCompactProps = () => {
      if (isLoading) {
        return { name: 'bookmark-outline', text: 'Loading...', color: colors.text.tertiary };
      }
      if (!isInList) {
        return { name: 'bookmark-outline', text: 'Add to Watchlist', color: colors.text.primary };
      }
      if (isWatched) {
        const ratingColor = watchlistItem.rating === 1 ? colors.accent.success :
                            watchlistItem.rating === -1 ? colors.accent.error : colors.accent.primary;
        return { name: 'checkmark-circle', text: 'Watched', color: ratingColor };
      }
      return { name: 'bookmark', text: 'In Watchlist', color: colors.accent.primary };
    };

    const compactProps = getCompactProps();

    // Direct toggle handler - add or remove without picker
    const handleCompactPress = () => {
      if (isInList) {
        handleRemoveFromWatchlist();
      } else {
        handleAddToWatchlist('want_to_watch');
      }
    };

    return (
      <Pressable
        onPress={handleCompactPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isLoading}
        style={style}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <GlassContainer style={styles.compactButton} borderRadius={layout.borderRadius.medium}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : (
              <Ionicons name={compactProps.name} size={20} color={compactProps.color} />
            )}
            <Text style={[typography.caption, { color: compactProps.color, marginLeft: spacing.xs }]}>
              {compactProps.text}
            </Text>
          </GlassContainer>
        </Animated.View>
      </Pressable>
    );
  }

  // Render different states
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.buttonContent}>
          <ActivityIndicator size="small" color={colors.text.primary} />
          <Text style={[typography.button, { color: colors.text.primary }]}>
            Loading...
          </Text>
        </View>
      );
    }

    if (!isInList) {
      return (
        <View style={styles.buttonContent}>
          <Ionicons
            name="bookmark-outline"
            size={size === 'large' ? 24 : 20}
            color={colors.text.primary}
          />
          <Text style={[typography.button, { color: colors.text.primary }]}>
            Add to Watchlist
          </Text>
        </View>
      );
    }

    if (isWatched) {
      const ratingIcon = watchlistItem.rating === 1 ? 'thumbs-up' :
                         watchlistItem.rating === -1 ? 'thumbs-down' : 'checkmark-circle';
      const ratingColor = watchlistItem.rating === 1 ? colors.accent.success :
                          watchlistItem.rating === -1 ? colors.accent.error : colors.accent.primary;

      return (
        <View style={styles.buttonContent}>
          <Ionicons
            name={ratingIcon}
            size={size === 'large' ? 24 : 20}
            color={ratingColor}
          />
          <Text style={[typography.button, { color: colors.text.primary }]}>
            Watched
          </Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color={colors.text.secondary}
          />
        </View>
      );
    }

    // Want to watch
    return (
      <View style={styles.buttonContent}>
        <Ionicons
          name="bookmark"
          size={size === 'large' ? 24 : 20}
          color={colors.accent.primary}
        />
        <Text style={[typography.button, { color: colors.text.primary }]}>
          Want to Watch
        </Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={colors.text.secondary}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isLoading}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <GlassContainer
            style={[
              styles.button,
              size === 'small' && styles.buttonSmall,
              isInList && {
                borderColor: isWatched ? colors.accent.success : colors.accent.primary,
                borderWidth: 1,
              },
            ]}
          >
            {renderContent()}
          </GlassContainer>
        </Animated.View>
      </Pressable>

      {/* Inline status picker when tapped */}
      {showPicker && watchlistItem && (
        <GlassContainer style={styles.picker}>
          <Text style={[typography.captionBold, styles.pickerTitle, { color: colors.text.secondary }]}>
            STATUS
          </Text>

          <View style={styles.statusButtons}>
            <Pressable
              onPress={() => {
                handleStatusChange('want_to_watch');
                setShowPicker(false);
              }}
              style={[
                styles.statusButton,
                {
                  backgroundColor: watchlistItem.status === 'want_to_watch'
                    ? colors.accent.primary
                    : colors.background.tertiary,
                },
              ]}
            >
              <Ionicons
                name="bookmark"
                size={18}
                color={watchlistItem.status === 'want_to_watch' ? '#FFFFFF' : colors.text.secondary}
              />
              <Text style={[
                typography.caption,
                {
                  color: watchlistItem.status === 'want_to_watch' ? '#FFFFFF' : colors.text.secondary,
                },
              ]}>
                Want to Watch
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                handleStatusChange('watched');
                setShowPicker(false);
              }}
              style={[
                styles.statusButton,
                {
                  backgroundColor: watchlistItem.status === 'watched'
                    ? colors.accent.success
                    : colors.background.tertiary,
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={watchlistItem.status === 'watched' ? '#FFFFFF' : colors.text.secondary}
              />
              <Text style={[
                typography.caption,
                {
                  color: watchlistItem.status === 'watched' ? '#FFFFFF' : colors.text.secondary,
                },
              ]}>
                Watched
              </Text>
            </Pressable>
          </View>

          {watchlistItem.status === 'watched' && (
            <>
              <Text style={[typography.captionBold, styles.pickerTitle, { color: colors.text.secondary, marginTop: spacing.md }]}>
                HOW WAS IT?
              </Text>
              <View style={styles.ratingButtons}>
                {[-1, 0, 1].map((rating) => {
                  const isActive = watchlistItem.rating === rating;
                  const icon = rating === 1 ? 'thumbs-up' : rating === -1 ? 'thumbs-down' : 'remove-circle';
                  const activeColor = rating === 1 ? colors.accent.success : rating === -1 ? colors.accent.error : colors.text.tertiary;

                  return (
                    <Pressable
                      key={rating}
                      onPress={() => handleRatingChange(rating)}
                      style={[
                        styles.ratingButton,
                        {
                          backgroundColor: isActive ? activeColor : colors.background.tertiary,
                        },
                      ]}
                    >
                      <Ionicons
                        name={isActive ? icon : `${icon}-outline`}
                        size={20}
                        color={isActive ? '#FFFFFF' : colors.text.secondary}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <Pressable
            onPress={() => {
              handleRemoveFromWatchlist();
              setShowPicker(false);
            }}
            style={styles.removeButton}
          >
            <Ionicons name="trash-outline" size={18} color={colors.accent.error} />
            <Text style={[typography.caption, { color: colors.accent.error }]}>
              Remove from Watchlist
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setShowPicker(false)}
            style={[styles.closeButton, { backgroundColor: colors.background.tertiary }]}
          >
            <Text style={[typography.caption, { color: colors.text.secondary }]}>
              Close
            </Text>
          </Pressable>
        </GlassContainer>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  button: {
    padding: spacing.md,
    borderRadius: 12,
  },
  buttonSmall: {
    padding: spacing.sm,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  picker: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
  },
  pickerTitle: {
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ratingButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: 8,
  },
});

export default memo(WatchlistButton);
