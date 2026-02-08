import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme, colors as themeColors, typography, spacing, layout } from '../theme';
import { saveUserProfile } from '../storage/userPreferences';
import GlassContainer from '../components/GlassContainer';
import OnboardingProgressBar from '../components/OnboardingProgressBar';

interface WelcomeScreenProps {
  navigation: any;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation values
  const buttonScale = useSharedValue(1);
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);

  // Animate logo on mount
  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 18, stiffness: 200 });
    logoOpacity.value = withTiming(1, { duration: 500 });
  }, []);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validate name
  const validateName = (value: string) => {
    if (value.length === 0) {
      setNameError('');
      return false;
    }
    if (value.length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    setNameError('');
    return true;
  };

  // Validate email
  const validateEmail = (value: string) => {
    if (value.length === 0) {
      setEmailError('');
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Handle name change
  const handleNameChange = (value: string) => {
    setName(value);
    if (value.length >= 2 || value.length === 0) {
      validateName(value);
    }
  };

  // Handle email change
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value.length > 0) {
      validateEmail(value);
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    const isNameValid = name.length >= 2;
    const isEmailValid = emailRegex.test(email);
    return isNameValid && isEmailValid && !nameError && !emailError;
  };

  // Handle continue button press
  const handleContinue = async () => {
    // Animate button press
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15 })
    );

    // Validate both fields
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);

    if (!isNameValid || !isEmailValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate unique user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Save user profile
      await saveUserProfile({
        userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        createdAt: Date.now(),
      });

      // Navigate to LocationScreen
      navigation.navigate('Location');
    } catch (error) {
      console.error('[WelcomeScreen] Error saving profile:', error);
      setEmailError('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, backgroundColor: colors.background.primary }]}>
      {/* Progress Bar */}
      <OnboardingProgressBar currentStep={1} totalSteps={4} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.md) }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Header Section */}
            <Animated.View style={[styles.header, logoAnimatedStyle]}>
              <Text style={[styles.logoEmoji]}>🎬</Text>
              <Text style={[typography.h1, styles.title, { color: colors.text.primary }]}>StreamFinder</Text>
              <Text style={[typography.caption, styles.tagline, { color: colors.text.secondary }]}>
                All your streaming services in one place
              </Text>
            </Animated.View>

            {/* Form Section */}
            <View style={styles.form}>
              {/* Name Input */}
              <Animated.View
                entering={FadeInDown.delay(200).springify().damping(22).stiffness(300)}
                style={styles.inputGroup}
              >
                <GlassContainer
                  style={styles.inputContainer}
                  borderRadius={layout.borderRadius.medium}
                  pressable={false}
                >
                  <TextInput
                    style={[typography.body, styles.input, { color: colors.text.primary }]}
                    placeholder="Your name"
                    placeholderTextColor={colors.text.tertiary}
                    value={name}
                    onChangeText={handleNameChange}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </GlassContainer>
                {nameError ? (
                  <Text style={[typography.metadata, styles.errorText, { color: colors.accent.error }]}>
                    {nameError}
                  </Text>
                ) : null}
              </Animated.View>

              {/* Email Input */}
              <Animated.View
                entering={FadeInDown.delay(300).springify().damping(22).stiffness(300)}
                style={styles.inputGroup}
              >
                <GlassContainer
                  style={styles.inputContainer}
                  borderRadius={layout.borderRadius.medium}
                  pressable={false}
                >
                  <TextInput
                    style={[typography.body, styles.input, { color: colors.text.primary }]}
                    placeholder="Email address"
                    placeholderTextColor={colors.text.tertiary}
                    value={email}
                    onChangeText={handleEmailChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="done"
                    onSubmitEditing={handleContinue}
                  />
                </GlassContainer>
                {emailError ? (
                  <Text style={[typography.metadata, styles.errorText, { color: colors.accent.error }]}>
                    {emailError}
                  </Text>
                ) : null}
              </Animated.View>

              {/* Continue Button */}
              <Animated.View
                entering={FadeInUp.delay(400).springify().damping(22).stiffness(300)}
                style={buttonAnimatedStyle}
              >
                <Pressable
                  style={[
                    styles.button,
                    { backgroundColor: colors.accent.primary },
                    (!isFormValid() || isSubmitting) && styles.buttonDisabled,
                  ]}
                  onPress={handleContinue}
                  disabled={!isFormValid() || isSubmitting}
                >
                  <Text style={[typography.button, styles.buttonText]}>
                    {isSubmitting ? 'Saving...' : 'Continue'}
                  </Text>
                </Pressable>
              </Animated.View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  tagline: {
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: spacing.xl,
  },
  inputContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  input: {
    minHeight: 24,
  },
  errorText: {
    marginTop: spacing.sm,
    marginLeft: spacing.sm,
  },
  button: {
    height: 50,
    borderRadius: layout.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default WelcomeScreen;
