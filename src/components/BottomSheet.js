/**
 * Bottom Sheet Component
 * Slide-up modal from bottom of screen
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, typography, spacing, layout } from '../theme';

const { height: screenHeight } = Dimensions.get('window');

const BottomSheet = ({
  visible = false,
  onClose,
  title,
  children,
  snapPoints = [0.5, 0.75, 1], // Percentage of screen height
  showHandle = true,
  isDismissable = true,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: screenHeight * (1 - snapPoints[snapPoints.length - 1]),
        useNativeDriver: false,
        tension: 30,
        friction: 7,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, slideAnim, snapPoints]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 50 && isDismissable) {
          onClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: screenHeight * (1 - snapPoints[snapPoints.length - 1]),
            useNativeDriver: false,
            tension: 30,
            friction: 7,
          }).start();
        }
      },
    })
  ).current;

  const handleBackdropPress = () => {
    if (isDismissable) {
      onClose();
    }
  };

  const maxHeight = screenHeight * snapPoints[snapPoints.length - 1];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: colors.overlay.heavy }]}
        onPress={handleBackdropPress}
      />

      <Animated.View
        style={[
          styles.sheetContainer,
          {
            transform: [{ translateY: slideAnim }],
            maxHeight,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Handle */}
        {showHandle && (
          <View
            style={[
              styles.handle,
              { backgroundColor: colors.background.tertiary },
            ]}
          >
            <View
              style={[
                styles.handleBar,
                { backgroundColor: colors.text.tertiary },
              ]}
            />
          </View>
        )}

        {/* Header */}
        {title && (
          <View
            style={[
              styles.header,
              {
                backgroundColor: colors.background.secondary,
                borderBottomColor: colors.glass.border,
              },
            ]}
          >
            <Text
              style={[
                typography.h3,
                { color: colors.text.primary },
              ]}
            >
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={24}
                color={colors.text.primary}
              />
            </Pressable>
          </View>
        )}

        {/* Content */}
        <View
          style={[
            styles.content,
            {
              backgroundColor: colors.background.primary,
              paddingBottom: insets.bottom || spacing.lg,
            },
          ]}
        >
          {children}
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: layout.borderRadius.large,
    borderTopRightRadius: layout.borderRadius.large,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  handle: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderTopLeftRadius: layout.borderRadius.large,
    borderTopRightRadius: layout.borderRadius.large,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
});

export { BottomSheet };
export default BottomSheet;
