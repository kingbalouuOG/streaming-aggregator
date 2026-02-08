import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { useTheme, colors as themeColors, typography, spacing, layout } from '../theme';
import ServiceCard from '../components/ServiceCard';
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
import { getWatchlistStats } from '../storage/watchlist';
import { logError } from '../utils/errorHandler';
import { UK_PROVIDERS_ARRAY } from '../constants/platforms';
import { GENRE_NAMES } from '../constants/genres';

// Service definitions matching web design
const SERVICE_COLORS: Record<string, { bg: string; label: string }> = {
  8: { bg: '#E50914', label: 'N' },      // Netflix
  9: { bg: '#00A8E1', label: 'P' },      // Prime Video
  350: { bg: '#1A1A1A', label: 'tv' },   // Apple TV+
  337: { bg: '#0063E5', label: 'D+' },   // Disney+
  1899: { bg: '#5C16C5', label: 'M' },   // Max (HBO)
  531: { bg: '#0064FF', label: 'P+' },   // Paramount+
  15: { bg: '#1CE783', label: 'H' },     // Hulu
  283: { bg: '#F47521', label: 'CR' },   // Crunchyroll
};

// All available genres
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

interface WatchlistStats {
  total: number;
  wantToWatch: number;
  watched: number;
}

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { colors, isDark, toggleTheme, themePreference, setSystemPreference } = useTheme();

  // Animation values
  const avatarScale = useSharedValue(0.8);

  // Loading and status states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState<WatchlistStats>({ total: 0, wantToWatch: 0, watched: 0 });

  // Original data (for change detection)
  const [originalProfile, setOriginalProfile] = useState<any>(null);
  const [originalPlatforms, setOriginalPlatforms] = useState<number[]>([]);
  const [originalGenres, setOriginalGenres] = useState<number[]>([]);

  // Editable data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);

  // Editing modes
  const [isEditingServices, setIsEditingServices] = useState(false);
  const [isEditingGenres, setIsEditingGenres] = useState(false);

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Edit modal state
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [modalName, setModalName] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalNameError, setModalNameError] = useState('');
  const [modalEmailError, setModalEmailError] = useState('');

  // Email validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Validators
  const validateName = (value: string) => {
    if (!value || value.trim().length === 0) {
      return { valid: false, error: 'Name is required' };
    }
    if (value.trim().length < 2) {
      return { valid: false, error: 'Name must be at least 2 characters' };
    }
    return { valid: true, error: '' };
  };

  const validateEmail = (value: string) => {
    if (!value || value.trim().length === 0) {
      return { valid: false, error: 'Email is required' };
    }
    if (!emailRegex.test(value.trim())) {
      return { valid: false, error: 'Please enter a valid email address' };
    }
    return { valid: true, error: '' };
  };

  // Animate avatar on mount
  useEffect(() => {
    avatarScale.value = withSpring(1, { damping: 18, stiffness: 200 });
  }, []);

  // Refresh stats when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

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
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
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

  const loadStats = async () => {
    try {
      const watchlistStats = await getWatchlistStats();
      if (watchlistStats) {
        setStats(watchlistStats);
      }
    } catch (err) {
      console.error('[ProfileScreen] Error loading stats:', err);
    }
  };

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
          .filter((p: any) => p.selected !== false)
          .map((p: any) => p.id);
        setOriginalPlatforms(platformIds);
        setSelectedPlatforms(platformIds);
      }

      // Load genres
      setOriginalGenres(genres);
      setSelectedGenres(genres);
    } catch (err) {
      logError(err, 'ProfileScreen loadUserData');
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlatform = (platformId: number) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(id => id !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
  };

  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev => {
      if (prev.includes(genreId)) {
        return prev.filter(id => id !== genreId);
      } else {
        return [...prev, genreId];
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

    setName(modalName.trim());
    setEmail(modalEmail.trim().toLowerCase());
    closeEditModal();
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
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Onboarding' as never }],
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
      await saveUserProfile({
        userId: originalProfile.userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        createdAt: originalProfile.createdAt,
      });

      const currentPreferences = await getUserPreferences();
      await saveUserPreferences({
        region: currentPreferences?.region || 'GB',
        platforms: UK_PROVIDERS_ARRAY.map(p => ({
          id: p.id,
          name: p.name,
          selected: selectedPlatforms.includes(p.id),
        })).filter(p => p.selected),
        homeGenres: currentPreferences?.homeGenres,
      });

      await setHomeGenres(selectedGenres);

      setOriginalProfile({
        ...originalProfile,
        name: name.trim(),
        email: email.trim().toLowerCase(),
      });
      setOriginalPlatforms([...selectedPlatforms]);
      setOriginalGenres([...selectedGenres]);
      setHasUnsavedChanges(false);

      Alert.alert('Success', 'Your profile has been updated.');
    } catch (err) {
      logError(err, 'ProfileScreen handleSave');
      setSaveError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    });
  };

  // Get initials from name
  const getInitials = () => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  // Animated avatar style
  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title */}
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Profile</Text>

        {/* Avatar & Info Section */}
        <View style={styles.avatarSection}>
          <Animated.View style={[styles.avatarContainer, avatarAnimatedStyle]}>
            <View style={[styles.avatar, { backgroundColor: colors.accent.primary }]}>
              <Text style={styles.avatarInitials}>{getInitials()}</Text>
            </View>
            <View style={[styles.avatarRing, { borderColor: colors.accent.primary + '30' }]} />
          </Animated.View>

          <Text style={[styles.userName, { color: colors.text.primary }]}>{name || 'User'}</Text>
          <Text style={[styles.userEmail, { color: colors.accent.primary }]}>{email}</Text>
          <Text style={[styles.memberSince, { color: colors.text.tertiary }]}>
            Member since {formatDate(originalProfile?.createdAt)}
          </Text>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statBadge, { backgroundColor: colors.background.tertiary }]}>
              <Ionicons name="bookmark" size={14} color={colors.accent.primary} />
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{stats.wantToWatch}</Text>
              <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Watchlist</Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: colors.background.tertiary }]}>
              <Ionicons name="eye" size={14} color="#10B981" />
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{stats.watched}</Text>
              <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Watched</Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: colors.background.tertiary }]}>
              <Ionicons name="tv" size={14} color="#3B82F6" />
              <Text style={[styles.statValue, { color: colors.text.primary }]}>{selectedPlatforms.length}</Text>
              <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Services</Text>
            </View>
          </View>
        </View>

        {/* Personal Details Section */}
        <View style={styles.section}>
          <SectionHeader title="Personal Details" colors={colors} />

          <View style={[styles.inputField, { backgroundColor: colors.background.tertiary, borderColor: colors.glass.border }]}>
            <Text style={[styles.inputLabel, { color: colors.text.tertiary }]}>Name</Text>
            <Text style={[styles.inputValue, { color: colors.text.primary }]}>{name || 'Not set'}</Text>
          </View>

          <View style={[styles.inputField, { backgroundColor: colors.background.tertiary, borderColor: colors.glass.border }]}>
            <Text style={[styles.inputLabel, { color: colors.text.tertiary }]}>Email</Text>
            <Text style={[styles.inputValue, { color: colors.text.primary }]}>{email || 'Not set'}</Text>
          </View>

          <Pressable
            style={[styles.outlineButton, { borderColor: colors.accent.primary + '66' }]}
            onPress={openEditModal}
          >
            <Ionicons name="pencil" size={14} color={colors.accent.primary} />
            <Text style={[styles.outlineButtonText, { color: colors.accent.primary }]}>Edit Details</Text>
          </Pressable>
        </View>

        {/* Streaming Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <SectionHeader title="Streaming Services" colors={colors} />
            <Pressable
              style={[
                styles.editToggleButton,
                { backgroundColor: isEditingServices ? colors.accent.primary : colors.background.tertiary }
              ]}
              onPress={() => setIsEditingServices(!isEditingServices)}
            >
              <Ionicons
                name={isEditingServices ? 'checkmark' : 'pencil'}
                size={14}
                color={isEditingServices ? '#FFFFFF' : colors.text.tertiary}
              />
            </Pressable>
          </View>

          {isEditingServices ? (
            <Animated.View entering={FadeIn.duration(200)} style={styles.servicesGrid}>
              {UK_PROVIDERS_ARRAY.map((platform) => {
                const isConnected = selectedPlatforms.includes(platform.id);
                const serviceColor = SERVICE_COLORS[platform.id] || { bg: '#6B7280', label: '?' };
                return (
                  <Pressable
                    key={platform.id}
                    style={[
                      styles.serviceCard,
                      {
                        backgroundColor: colors.background.tertiary,
                        borderColor: isConnected ? colors.accent.primary + '66' : colors.glass.border,
                        opacity: isConnected ? 1 : 0.5,
                      }
                    ]}
                    onPress={() => togglePlatform(platform.id)}
                  >
                    <View style={[styles.serviceBadge, { backgroundColor: serviceColor.bg }]}>
                      <Text style={styles.serviceBadgeText}>{serviceColor.label}</Text>
                    </View>
                    <View style={styles.serviceInfo}>
                      <Text style={[styles.serviceName, { color: colors.text.primary }]} numberOfLines={1}>
                        {platform.name}
                      </Text>
                      <Text style={[styles.serviceStatus, { color: isConnected ? '#10B981' : colors.text.tertiary }]}>
                        {isConnected ? 'Connected' : 'Not connected'}
                      </Text>
                    </View>
                    <View style={[
                      styles.checkCircle,
                      {
                        backgroundColor: isConnected ? colors.accent.primary : 'transparent',
                        borderColor: isConnected ? colors.accent.primary : colors.glass.border,
                      }
                    ]}>
                      {isConnected && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                    </View>
                  </Pressable>
                );
              })}
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(200)} style={styles.servicesRow}>
              {selectedPlatforms.map((platformId) => {
                const serviceColor = SERVICE_COLORS[platformId] || { bg: '#6B7280', label: '?' };
                return (
                  <View
                    key={platformId}
                    style={[styles.serviceBadgeLarge, { backgroundColor: serviceColor.bg }]}
                  >
                    <Text style={styles.serviceBadgeLargeText}>{serviceColor.label}</Text>
                  </View>
                );
              })}
              {selectedPlatforms.length === 0 && (
                <Text style={[styles.noServicesText, { color: colors.text.tertiary }]}>No services connected</Text>
              )}
            </Animated.View>
          )}
        </View>

        {/* Homepage Genres Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <SectionHeader title="Homepage Genres" colors={colors} />
            <Pressable
              style={[
                styles.editToggleButton,
                { backgroundColor: isEditingGenres ? colors.accent.primary : colors.background.tertiary }
              ]}
              onPress={() => setIsEditingGenres(!isEditingGenres)}
            >
              <Ionicons
                name={isEditingGenres ? 'checkmark' : 'pencil'}
                size={14}
                color={isEditingGenres ? '#FFFFFF' : colors.text.tertiary}
              />
            </Pressable>
          </View>

          <View style={styles.genresWrap}>
            {(isEditingGenres ? ALL_GENRES : ALL_GENRES.filter(g => selectedGenres.includes(g.id))).map((genre) => {
              const isSelected = selectedGenres.includes(genre.id);
              return (
                <Pressable
                  key={genre.id}
                  style={[
                    styles.genreChip,
                    {
                      backgroundColor: isSelected
                        ? (isEditingGenres ? colors.accent.primary + '26' : colors.background.tertiary)
                        : colors.background.tertiary + '66',
                      borderColor: isSelected && isEditingGenres ? colors.accent.primary + '66' : colors.glass.border,
                    }
                  ]}
                  onPress={() => isEditingGenres && toggleGenre(genre.id)}
                  disabled={!isEditingGenres}
                >
                  <Text style={[
                    styles.genreChipText,
                    {
                      color: isSelected
                        ? (isEditingGenres ? colors.accent.primary : colors.text.primary)
                        : colors.text.tertiary + '80',
                    }
                  ]}>
                    {genre.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <SectionHeader title="Appearance" colors={colors} />

          <View style={[styles.themeCard, { backgroundColor: colors.background.tertiary, borderColor: colors.glass.border }]}>
            <Ionicons name="moon" size={16} color={colors.text.tertiary} />
            <View style={styles.themeInfo}>
              <Text style={[styles.themeLabel, { color: colors.text.primary }]}>Theme</Text>
              <Text style={[styles.themeValue, { color: colors.text.tertiary }]}>
                {themePreference ? (themePreference === 'light' ? 'Light' : 'Dark') : 'System'}
              </Text>
            </View>
            <View style={[styles.themeToggle, { backgroundColor: colors.background.primary }]}>
              <Pressable
                style={[
                  styles.themeOption,
                  isDark && { backgroundColor: colors.background.tertiary }
                ]}
                onPress={() => !isDark && toggleTheme()}
              >
                <Ionicons name="moon" size={14} color={isDark ? colors.text.primary : colors.text.tertiary} />
              </Pressable>
              <Pressable
                style={[
                  styles.themeOption,
                  !isDark && { backgroundColor: colors.background.tertiary }
                ]}
                onPress={() => isDark && toggleTheme()}
              >
                <Ionicons name="sunny" size={14} color={!isDark ? colors.text.primary : colors.text.tertiary} />
              </Pressable>
            </View>
          </View>

          {themePreference && (
            <Pressable
              style={[styles.outlineButton, { borderColor: colors.glass.border }]}
              onPress={setSystemPreference}
            >
              <Ionicons name="settings-outline" size={16} color={colors.text.tertiary} />
              <Text style={[styles.outlineButtonText, { color: colors.text.tertiary }]}>Use System Preference</Text>
            </Pressable>
          )}
        </View>

        {/* Error Message */}
        {saveError && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.accent.error }]}>{saveError}</Text>
          </View>
        )}

        {/* Save Button */}
        <Pressable
          style={[
            styles.saveButton,
            {
              backgroundColor: hasUnsavedChanges && !isSaving ? colors.background.tertiary : colors.background.tertiary,
              borderColor: colors.glass.border,
            }
          ]}
          onPress={handleSave}
          disabled={!hasUnsavedChanges || isSaving}
        >
          <Text style={[styles.saveButtonText, { color: colors.text.tertiary }]}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Text>
        </Pressable>

        {/* Sign Out Button */}
        <Pressable
          style={[styles.signOutButton, { backgroundColor: '#EF444426', borderColor: '#EF444433' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={16} color="#EF4444" />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </Pressable>

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
          <View style={[styles.modalContent, { backgroundColor: colors.background.secondary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Edit Details</Text>
              <Pressable onPress={closeEditModal} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </Pressable>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalInputLabel, { color: colors.text.tertiary }]}>NAME</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background.tertiary, color: colors.text.primary, borderColor: colors.glass.border }]}
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
                <Text style={[styles.modalError, { color: colors.accent.error }]}>{modalNameError}</Text>
              ) : null}
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalInputLabel, { color: colors.text.tertiary }]}>EMAIL</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background.tertiary, color: colors.text.primary, borderColor: colors.glass.border }]}
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
                <Text style={[styles.modalError, { color: colors.accent.error }]}>{modalEmailError}</Text>
              ) : null}
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalCancelButton, { backgroundColor: colors.background.tertiary }]}
                onPress={closeEditModal}
              >
                <Ionicons name="close" size={16} color={colors.text.tertiary} />
                <Text style={[styles.modalCancelText, { color: colors.text.tertiary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSaveButton, { backgroundColor: colors.accent.primary }]}
                onPress={handleModalSave}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.modalSaveText}>Save Details</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Section Header Component
const SectionHeader = ({ title, colors }: { title: string; colors: any }) => (
  <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>{title}</Text>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 44,
    borderWidth: 2,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    marginBottom: 2,
  },
  memberSince: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 11,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  editToggleButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputField: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  inputValue: {
    fontSize: 14,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  outlineButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '48%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  serviceBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  serviceInfo: {
    flex: 1,
    minWidth: 0,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '600',
  },
  serviceStatus: {
    fontSize: 10,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servicesRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  serviceBadgeLarge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceBadgeLargeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  noServicesText: {
    fontSize: 12,
  },
  genresWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  genreChipText: {
    fontSize: 12,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  themeInfo: {
    flex: 1,
  },
  themeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  themeValue: {
    fontSize: 11,
  },
  themeToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  themeOption: {
    padding: 6,
    borderRadius: 6,
  },
  errorContainer: {
    marginBottom: 12,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  signOutButtonText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 32,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalInputGroup: {
    marginBottom: 16,
  },
  modalInputLabel: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  modalError: {
    marginTop: 8,
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ProfileScreen;
