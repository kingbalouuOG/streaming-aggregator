import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { colors, typography, spacing, layout } from '../theme';
import { saveUserProfile } from '../storage/userPreferences';
import GlassContainer from '../components/GlassContainer';

const WelcomeScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validate name
  const validateName = (value) => {
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
  const validateEmail = (value) => {
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
  const handleNameChange = (value) => {
    setName(value);
    if (value.length >= 2 || value.length === 0) {
      validateName(value);
    }
  };

  // Handle email change
  const handleEmailChange = (value) => {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
              <Text style={[typography.h1, styles.title]}>StreamFinder</Text>
              <Text style={[typography.caption, styles.tagline]}>
                All your streaming services in one place
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.form}>
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <GlassContainer
                  style={styles.inputContainer}
                  borderRadius={layout.borderRadius.medium}
                >
                  <TextInput
                    style={[typography.body, styles.input]}
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
                  <Text style={[typography.metadata, styles.errorText]}>
                    {nameError}
                  </Text>
                ) : null}
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <GlassContainer
                  style={styles.inputContainer}
                  borderRadius={layout.borderRadius.medium}
                >
                  <TextInput
                    style={[typography.body, styles.input]}
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
                  <Text style={[typography.metadata, styles.errorText]}>
                    {emailError}
                  </Text>
                ) : null}
              </View>

              {/* Continue Button */}
              <Pressable
                style={[
                  styles.button,
                  (!isFormValid() || isSubmitting) && styles.buttonDisabled,
                ]}
                onPress={handleContinue}
                disabled={!isFormValid() || isSubmitting}
              >
                <Text style={[typography.button, styles.buttonText]}>
                  {isSubmitting ? 'Saving...' : 'Continue'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  tagline: {
    textAlign: 'center',
    color: colors.text.secondary,
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
    color: colors.text.primary,
    minHeight: 24,
  },
  errorText: {
    color: colors.accent.error,
    marginTop: spacing.sm,
    marginLeft: spacing.sm,
  },
  button: {
    height: 50,
    backgroundColor: colors.accent.primary,
    borderRadius: layout.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.text.primary,
  },
});

export default WelcomeScreen;
