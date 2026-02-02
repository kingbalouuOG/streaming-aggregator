import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, layout } from '../theme';
import ServiceCard from '../components/ServiceCard';
import ProfileAvatar from '../components/ProfileAvatar';
import GlassContainer from '../components/GlassContainer';
import {
  getUserProfile,
  saveUserProfile,
  getUserPreferences,
  saveUserPreferences,
  getHomeGenres,
  setHomeGenres,
  clearAllData,
} from '../storage/userPreferences';
import { UK_PROVIDERS_ARRAY } from '../constants/platforms';
import { GENRE_NAMES } from '../constants/genres';

// All available genres (matching FilterModal)
const ALL_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

const ProfileScreen = () => {
  const navigation = useNavigation();

  // Loading and status states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Original data (for change detection)
  const [originalProfile, setOriginalProfile] = useState(null);
  const [originalPlatforms, setOriginalPlatforms] = useState([]);
  const [originalGenres, setOriginalGenres] = useState([]);

  // Editable data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Edit modal state
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [modalName, setModalName] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalNameError, setModalNameError] = useState('');
  const [modalEmailError, setModalEmailError] = useState('');

  // Genre modal state
  const [isGenreModalVisible, setIsGenreModalVisible] = useState(false);
  const [modalGenres, setModalGenres] = useState([]);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validators
  const validateName = (value) => {
    if (!value || value.trim().length === 0) {
      return { valid: false, error: 'Name is required' };
    }
    if (value.trim().length < 2) {
      return { valid: false, error: 'Name must be at least 2 characters' };
    }
    return { valid: true };
  };

  const validateEmail = (value) => {
    if (!value || value.trim().length === 0) {
      return { valid: false, error: 'Email is required' };
    }
    if (!emailRegex.test(value.trim())) {
      return { valid: false, error: 'Please enter a valid email address' };
    }
    return { valid: true };
  };

  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Detect changes
  useEffect(() => {
    if (!originalProfile) return;

    const profileChanged =
      name !== originalProfile.name ||
      email !== originalProfile.email;

    const platformsChanged =
      JSON.stringify([...selectedPlatforms].sort()) !==
      JSON.stringify([...originalPlatforms].sort());

    const genresChanged =
      JSON.stringify([...selectedGenres].sort()) !==
      JSON.stringify([...originalGenres].sort());

    setHasUnsavedChanges(profileChanged || platformsChanged || genresChanged);
  }, [name, email, selectedPlatforms, selectedGenres, originalProfile, originalPlatforms, originalGenres]);

  // Navigation guard for unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasUnsavedChanges) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);

      const [profile, preferences, genres] = await Promise.all([
        getUserProfile(),
        getUserPreferences(),
        getHomeGenres(),
      ]);

      if (profile) {
        setOriginalProfile(profile);
        setName(profile.name || '');
        setEmail(profile.email || '');
      }

      if (preferences?.platforms) {
        const platformIds = preferences.platforms
          .filter(p => p.selected !== false)
          .map(p => p.id);
        setOriginalPlatforms(platformIds);
        setSelectedPlatforms(platformIds);
      }

      // Load genres
      setOriginalGenres(genres);
      setSelectedGenres(genres);
    } catch (error) {
      console.error('[ProfileScreen] Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlatform = (platformId) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(id => id !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
  };

  // Modal handlers
  const openEditModal = () => {
    setModalName(name);
    setModalEmail(email);
    setModalNameError('');
    setModalEmailError('');
    setIsEditModalVisible(true);
  };

  const closeEditModal = () => {
    setIsEditModalVisible(false);
    setModalNameError('');
    setModalEmailError('');
  };

  const handleModalSave = () => {
    // Validate fields
    const nameValidation = validateName(modalName);
    const emailValidation = validateEmail(modalEmail);

    if (!nameValidation.valid) {
      setModalNameError(nameValidation.error);
      return;
    }
    if (!emailValidation.valid) {
      setModalEmailError(emailValidation.error);
      return;
    }

    // Update the main state (this triggers unsaved changes detection)
    setName(modalName.trim());
    setEmail(modalEmail.trim().toLowerCase());
    closeEditModal();
  };

  // Genre modal handlers
  const openGenreModal = () => {
    setModalGenres([...selectedGenres]);
    setIsGenreModalVisible(true);
  };

  const closeGenreModal = () => {
    setIsGenreModalVisible(false);
  };

  const toggleModalGenre = (genreId) => {
    setModalGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const handleGenreModalSave = () => {
    if (modalGenres.length === 0) {
      return; // Require at least one genre
    }
    setSelectedGenres(modalGenres);
    closeGenreModal();
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? This will clear all your data and return you to the welcome screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              // Reset navigation to onboarding
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Onboarding' }],
                })
              );
            } catch (error) {
              console.error('[ProfileScreen] Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    setSaveError(null);

    // Validate all fields
    const nameValidation = validateName(name);
    const emailValidation = validateEmail(email);

    if (!nameValidation.valid) {
      setSaveError(nameValidation.error);
      return;
    }
    if (!emailValidation.valid) {
      setSaveError(emailValidation.error);
      return;
    }
    if (selectedPlatforms.length === 0) {
      setSaveError('Please select at least one streaming service');
      return;
    }

    setIsSaving(true);

    try {
      // Save profile (preserve userId and createdAt)
      await saveUserProfile({
        userId: originalProfile.userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        createdAt: originalProfile.createdAt,
      });

      // Save preferences
      const currentPreferences = await getUserPreferences();
      await saveUserPreferences({
        region: currentPreferences?.region || 'GB',
        platforms: UK_PROVIDERS_ARRAY.map(p => ({
          id: p.id,
          name: p.name,
          selected: selectedPlatforms.includes(p.id),
        })).filter(p => p.selected),
        homeGenres: currentPreferences?.homeGenres, // Preserve existing genres
      });

      // Save home genres
      await setHomeGenres(selectedGenres);

      // Update original state
      setOriginalProfile({
        ...originalProfile,
        name: name.trim(),
        email: email.trim().toLowerCase(),
      });
      setOriginalPlatforms([...selectedPlatforms]);
      setOriginalGenres([...selectedGenres]);
      setHasUnsavedChanges(false);

      Alert.alert('Success', 'Your profile has been updated.');
    } catch (error) {
      console.error('[ProfileScreen] Save error:', error);
      setSaveError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <ProfileAvatar name={name} size={80} />
          <Text style={[typography.h2, styles.displayName]}>{name || 'User'}</Text>
          <Text style={[typography.body, styles.displayEmail]}>{email}</Text>
          <Text style={[typography.metadata, styles.memberSince]}>
            Member since {formatDate(originalProfile?.createdAt)}
          </Text>
        </View>

        {/* Personal Details Section */}
        <View style={styles.section}>
          <Text style={[typography.caption, styles.sectionLabel]}>
            PERSONAL DETAILS
          </Text>

          {/* Display-only Name Field */}
          <GlassContainer
            style={styles.displayField}
            borderRadius={layout.borderRadius.medium}
          >
            <Text style={[typography.metadata, styles.fieldLabel]}>NAME</Text>
            <Text style={[typography.body, styles.fieldValue]}>{name || 'Not set'}</Text>
          </GlassContainer>

          {/* Display-only Email Field */}
          <GlassContainer
            style={styles.displayField}
            borderRadius={layout.borderRadius.medium}
          >
            <Text style={[typography.metadata, styles.fieldLabel]}>EMAIL</Text>
            <Text style={[typography.body, styles.fieldValue]}>{email || 'Not set'}</Text>
          </GlassContainer>

          {/* Edit Details Button */}
          <Pressable style={styles.editButton} onPress={openEditModal}>
            <Ionicons name="pencil" size={18} color={colors.accent.primary} />
            <Text style={styles.editButtonText}>Edit Details</Text>
          </Pressable>
        </View>

        {/* Streaming Services Section */}
        <View style={styles.section}>
          <Text style={[typography.caption, styles.sectionLabel]}>
            STREAMING SERVICES
          </Text>
          <Text style={[typography.metadata, styles.sectionHint]}>
            Select the services you subscribe to
          </Text>

          <View style={styles.platformGrid}>
            {UK_PROVIDERS_ARRAY.map((platform) => (
              <ServiceCard
                key={platform.id}
                platformId={platform.id}
                name={platform.name}
                color={platform.color}
                selected={selectedPlatforms.includes(platform.id)}
                onPress={() => togglePlatform(platform.id)}
              />
            ))}
          </View>
        </View>

        {/* Homepage Genres Section */}
        <View style={styles.section}>
          <Text style={[typography.caption, styles.sectionLabel]}>
            HOMEPAGE GENRES
          </Text>
          <Text style={[typography.metadata, styles.sectionHint]}>
            Choose which genres appear on your homepage
          </Text>

          <View style={styles.genreChipsContainer}>
            {selectedGenres.map((genreId) => (
              <View key={genreId} style={styles.genreChip}>
                <Text style={styles.genreChipText}>
                  {GENRE_NAMES[genreId] || `Genre ${genreId}`}
                </Text>
              </View>
            ))}
          </View>

          <Pressable style={styles.editButton} onPress={openGenreModal}>
            <Ionicons name="musical-notes" size={18} color={colors.accent.primary} />
            <Text style={styles.editButtonText}>Edit Genres</Text>
          </Pressable>
        </View>

        {/* Error Message */}
        {saveError && (
          <View style={styles.errorContainer}>
            <Text style={[typography.body, styles.errorText]}>{saveError}</Text>
          </View>
        )}

        {/* Save Button */}
        <Pressable
          style={[
            styles.saveButton,
            (!hasUnsavedChanges || isSaving) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasUnsavedChanges || isSaving}
        >
          <Text style={[typography.button, styles.saveButtonText]}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Text>
        </Pressable>

        {/* Logout Button */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.accent.error} />
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </Pressable>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Edit Details Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[typography.h3, styles.modalTitle]}>Edit Details</Text>
              <Pressable onPress={closeEditModal} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </Pressable>
            </View>

            {/* Name Input */}
            <View style={styles.modalInputGroup}>
              <Text style={[typography.metadata, styles.modalInputLabel]}>NAME</Text>
              <TextInput
                style={[typography.body, styles.modalInput]}
                value={modalName}
                onChangeText={(text) => {
                  setModalName(text);
                  if (modalNameError) {
                    const validation = validateName(text);
                    if (validation.valid) setModalNameError('');
                  }
                }}
                autoCapitalize="words"
                autoCorrect={false}
                placeholder="Enter your name"
                placeholderTextColor={colors.text.tertiary}
              />
              {modalNameError ? (
                <Text style={styles.modalError}>{modalNameError}</Text>
              ) : null}
            </View>

            {/* Email Input */}
            <View style={styles.modalInputGroup}>
              <Text style={[typography.metadata, styles.modalInputLabel]}>EMAIL</Text>
              <TextInput
                style={[typography.body, styles.modalInput]}
                value={modalEmail}
                onChangeText={(text) => {
                  setModalEmail(text);
                  if (modalEmailError) {
                    const validation = validateEmail(text);
                    if (validation.valid) setModalEmailError('');
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Enter your email"
                placeholderTextColor={colors.text.tertiary}
              />
              {modalEmailError ? (
                <Text style={styles.modalError}>{modalEmailError}</Text>
              ) : null}
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={closeEditModal}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSaveButton} onPress={handleModalSave}>
                <Text style={styles.modalSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Genre Selection Modal */}
      <Modal
        visible={isGenreModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeGenreModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.genreModalContent]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[typography.h3, styles.modalTitle]}>Select Genres</Text>
              <Pressable onPress={closeGenreModal} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </Pressable>
            </View>

            <Text style={[typography.metadata, styles.genreModalHint]}>
              Choose genres to display on your homepage
            </Text>

            {/* Genre Grid */}
            <ScrollView style={styles.genreModalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.genreModalGrid}>
                {ALL_GENRES.map((genre) => (
                  <Pressable
                    key={genre.id}
                    onPress={() => toggleModalGenre(genre.id)}
                    style={[
                      styles.genreModalChip,
                      modalGenres.includes(genre.id) && styles.genreModalChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.genreModalChipText,
                        modalGenres.includes(genre.id) && styles.genreModalChipTextSelected,
                      ]}
                    >
                      {genre.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={closeGenreModal}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalSaveButton,
                  modalGenres.length === 0 && styles.modalSaveButtonDisabled,
                ]}
                onPress={handleGenreModalSave}
                disabled={modalGenres.length === 0}
              >
                <Text style={styles.modalSaveText}>
                  Save ({modalGenres.length} selected)
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  displayName: {
    marginTop: spacing.lg,
    color: colors.text.primary,
  },
  displayEmail: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
  },
  memberSince: {
    marginTop: spacing.sm,
    color: colors.text.tertiary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    color: colors.text.secondary,
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  sectionHint: {
    color: colors.text.tertiary,
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  displayField: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },
  fieldValue: {
    color: colors.text.primary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.background.tertiary,
    borderRadius: layout.borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.glass.border,
    marginTop: spacing.sm,
  },
  editButtonText: {
    color: colors.accent.primary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  errorContainer: {
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.accent.error,
    textAlign: 'center',
  },
  saveButton: {
    height: 50,
    backgroundColor: colors.accent.primary,
    borderRadius: layout.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: colors.background.tertiary,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: colors.background.primary,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginTop: spacing.lg,
    backgroundColor: 'transparent',
    borderRadius: layout.borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.accent.error,
  },
  logoutButtonText: {
    color: colors.accent.error,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.background.secondary,
    borderRadius: layout.borderRadius.large,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    color: colors.text.primary,
  },
  modalInputGroup: {
    marginBottom: spacing.lg,
  },
  modalInputLabel: {
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },
  modalInput: {
    backgroundColor: colors.background.tertiary,
    borderRadius: layout.borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.glass.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text.primary,
  },
  modalError: {
    color: colors.accent.error,
    marginTop: spacing.sm,
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: layout.borderRadius.medium,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.text.secondary,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: layout.borderRadius.medium,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
  },
  modalSaveText: {
    color: colors.background.primary,
    fontWeight: '600',
  },
  modalSaveButtonDisabled: {
    opacity: 0.5,
  },
  // Genre styles
  genreChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  genreChip: {
    backgroundColor: colors.background.tertiary,
    borderRadius: layout.borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  genreChipText: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  // Genre modal styles
  genreModalContent: {
    maxHeight: '80%',
  },
  genreModalHint: {
    color: colors.text.tertiary,
    marginBottom: spacing.lg,
    marginTop: -spacing.md,
  },
  genreModalScroll: {
    maxHeight: 300,
    marginBottom: spacing.lg,
  },
  genreModalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreModalChip: {
    backgroundColor: colors.background.tertiary,
    borderRadius: layout.borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  genreModalChipSelected: {
    backgroundColor: colors.glass.medium,
    borderColor: colors.accent.primary,
    borderWidth: 2,
  },
  genreModalChipText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  genreModalChipTextSelected: {
    color: colors.text.primary,
    fontWeight: '600',
  },
});

export default ProfileScreen;
