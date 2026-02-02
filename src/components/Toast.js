/**
 * Toast Notification Component
 * Non-blocking notification that appears at top/bottom of screen
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, typography, spacing, layout } from '../theme';

export const ToastManager = {
  _listeners: [],
  
  subscribe(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  },

  show(message, options = {}) {
    const {
      type = 'info', // 'info', 'success', 'warning', 'error'
      duration = 3000,
      position = 'top',
    } = options;

    this._listeners.forEach(listener => {
      listener({ message, type, duration, position });
    });
  },
};

const Toast = () => {
  const { colors } = useTheme();
  const [toasts, setToasts] = useState([]);
  const slideAnim = new Animated.Value(0);

  useEffect(() => {
    const unsubscribe = ToastManager.subscribe(({ message, type, duration, position }) => {
      const id = Math.random();
      const newToast = { id, message, type, position };

      setToasts(prev => [...prev, newToast]);

      // Auto-remove after duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          removeToast(id);
        }, duration);

        return () => clearTimeout(timer);
      }
    });

    return unsubscribe;
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success':
        return colors.accent.success;
      case 'error':
        return colors.accent.error;
      case 'warning':
        return colors.accent.warning;
      default:
        return colors.accent.primary;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'alert-circle';
      default:
        return 'information-circle';
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <Pressable
          key={toast.id}
          style={[
            styles.toast,
            {
              backgroundColor: colors.background.secondary,
              borderColor: colors.glass.border,
              marginTop: toast.position === 'top' ? spacing.lg : 0,
              marginBottom: toast.position === 'bottom' ? spacing.lg : 0,
            },
          ]}
          onPress={() => removeToast(toast.id)}
        >
          <Ionicons
            name={getTypeIcon(toast.type)}
            size={20}
            color={getTypeColor(toast.type)}
            style={styles.icon}
          />
          <Text
            style={[
              typography.body,
              styles.message,
              { color: colors.text.primary },
            ]}
            numberOfLines={2}
          >
            {toast.message}
          </Text>
          <Pressable
            onPress={() => removeToast(toast.id)}
            hitSlop={8}
          >
            <Ionicons
              name="close"
              size={18}
              color={colors.text.tertiary}
            />
          </Pressable>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: spacing.lg,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: layout.borderRadius.medium,
    borderWidth: 1,
    marginVertical: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginRight: spacing.md,
  },
  message: {
    flex: 1,
  },
});

export { Toast, ToastManager };
export default Toast;
