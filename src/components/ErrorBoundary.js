/**
 * ErrorBoundary Component
 * Catches React errors and displays fallback UI
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, layout } from '../theme';
import GlassContainer from './GlassContainer';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send error to logging service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <GlassContainer style={styles.errorCard} borderRadius={layout.borderRadius.large}>
              <Ionicons
                name="warning-outline"
                size={64}
                color={colors.accent.error}
                style={styles.icon}
              />
              <Text style={[typography.h2, styles.title]}>Oops! Something went wrong</Text>
              <Text style={[typography.body, styles.message]}>
                The app encountered an unexpected error. This has been logged and we'll look into
                it.
              </Text>

              {__DEV__ && this.state.error && (
                <View style={styles.errorDetails}>
                  <Text style={[typography.caption, styles.errorText]}>
                    {this.state.error.toString()}
                  </Text>
                </View>
              )}

              <Pressable style={styles.button} onPress={this.handleReset}>
                <Text style={[typography.button, styles.buttonText]}>Try Again</Text>
              </Pressable>
            </GlassContainer>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorCard: {
    padding: spacing.xxl,
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  icon: {
    marginBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.md,
    textAlign: 'center',
    color: colors.text.primary,
  },
  message: {
    marginBottom: spacing.xl,
    textAlign: 'center',
    color: colors.text.secondary,
    lineHeight: 24,
  },
  errorDetails: {
    width: '100%',
    padding: spacing.md,
    backgroundColor: colors.background.tertiary,
    borderRadius: layout.borderRadius.small,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.accent.error,
    fontFamily: 'monospace',
  },
  button: {
    height: 50,
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.accent.primary,
    borderRadius: layout.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.text.primary,
  },
});

export default ErrorBoundary;
