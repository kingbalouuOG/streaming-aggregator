import AsyncStorage from '@react-native-async-storage/async-storage';

const DEBUG = __DEV__;

// Storage keys
const STORAGE_KEYS = {
  USER_PROFILE: '@user_profile',
  USER_PREFERENCES: '@user_preferences',
};

/**
 * Save user profile data
 * @param {Object} profile - User profile data
 * @param {string} profile.userId - Unique user ID (UUID)
 * @param {string} profile.name - User's name
 * @param {string} profile.email - User's email
 * @param {number} profile.createdAt - Timestamp of account creation
 * @returns {Promise<void>}
 */
export const saveUserProfile = async (profile) => {
  try {
    // Validate required fields
    if (!profile.userId || !profile.name || !profile.email) {
      throw new Error('Profile must include userId, name, and email');
    }

    // Add createdAt if not provided
    const profileData = {
      ...profile,
      createdAt: profile.createdAt || Date.now(),
    };

    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_PROFILE,
      JSON.stringify(profileData)
    );

    if (DEBUG) {
      console.log('[Storage] User profile saved:', profileData.userId);
    }
  } catch (error) {
    console.error('[Storage] Error saving user profile:', error);
    throw error;
  }
};

/**
 * Get user profile data
 * @returns {Promise<Object|null>} User profile or null if not found
 */
export const getUserProfile = async () => {
  try {
    const profile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);

    if (!profile) {
      if (DEBUG) console.log('[Storage] No user profile found');
      return null;
    }

    const parsed = JSON.parse(profile);
    if (DEBUG) console.log('[Storage] User profile retrieved:', parsed.userId);
    return parsed;
  } catch (error) {
    console.error('[Storage] Error getting user profile:', error);
    return null;
  }
};

/**
 * Save user preferences
 * @param {Object} preferences - User preferences
 * @param {string} preferences.region - Region code (e.g., 'GB')
 * @param {Array<Object>} preferences.platforms - Selected platforms
 * @returns {Promise<void>}
 */
export const saveUserPreferences = async (preferences) => {
  try {
    // Validate required fields
    if (!preferences.region) {
      throw new Error('Preferences must include region');
    }

    if (!preferences.platforms || !Array.isArray(preferences.platforms)) {
      throw new Error('Preferences must include platforms array');
    }

    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_PREFERENCES,
      JSON.stringify(preferences)
    );

    if (DEBUG) {
      console.log(
        '[Storage] User preferences saved:',
        preferences.region,
        `${preferences.platforms.length} platforms`
      );
    }
  } catch (error) {
    console.error('[Storage] Error saving user preferences:', error);
    throw error;
  }
};

/**
 * Get user preferences
 * @returns {Promise<Object|null>} User preferences or null if not found
 */
export const getUserPreferences = async () => {
  try {
    const preferences = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);

    if (!preferences) {
      if (DEBUG) console.log('[Storage] No user preferences found');
      return null;
    }

    const parsed = JSON.parse(preferences);
    if (DEBUG) {
      console.log(
        '[Storage] User preferences retrieved:',
        parsed.region,
        `${parsed.platforms?.length || 0} platforms`
      );
    }
    return parsed;
  } catch (error) {
    console.error('[Storage] Error getting user preferences:', error);
    return null;
  }
};

/**
 * Get selected platform IDs
 * @returns {Promise<Array<number>>} Array of platform IDs
 */
export const getSelectedPlatforms = async () => {
  try {
    const preferences = await getUserPreferences();

    if (!preferences || !preferences.platforms) {
      if (DEBUG) console.log('[Storage] No platforms found');
      return [];
    }

    // Extract platform IDs from platforms array
    const platformIds = preferences.platforms
      .filter(p => p.selected !== false) // Filter out deselected platforms
      .map(p => p.id);

    if (DEBUG) {
      console.log('[Storage] Selected platforms:', platformIds);
    }

    return platformIds;
  } catch (error) {
    console.error('[Storage] Error getting selected platforms:', error);
    return [];
  }
};

// Default home genres (used when user skips genre selection)
export const DEFAULT_HOME_GENRES = [
  28,    // Action
  35,    // Comedy
  18,    // Drama
  53,    // Thriller
  878,   // Sci-Fi
  27,    // Horror
  10749, // Romance
  80,    // Crime
];

/**
 * Get user's selected homepage genres
 * @returns {Promise<Array<number>>} Array of genre IDs
 */
export const getHomeGenres = async () => {
  try {
    const preferences = await getUserPreferences();

    if (!preferences || !preferences.homeGenres || preferences.homeGenres.length === 0) {
      if (DEBUG) console.log('[Storage] No home genres found, using defaults');
      return DEFAULT_HOME_GENRES;
    }

    if (DEBUG) {
      console.log('[Storage] Home genres retrieved:', preferences.homeGenres.length, 'genres');
    }
    return preferences.homeGenres;
  } catch (error) {
    console.error('[Storage] Error getting home genres:', error);
    return DEFAULT_HOME_GENRES;
  }
};

/**
 * Save user's homepage genre selections
 * @param {Array<number>} genreIds - Array of genre IDs
 * @returns {Promise<void>}
 */
export const setHomeGenres = async (genreIds) => {
  try {
    const preferences = await getUserPreferences();

    await saveUserPreferences({
      ...preferences,
      homeGenres: genreIds,
    });

    if (DEBUG) {
      console.log('[Storage] Home genres saved:', genreIds.length, 'genres');
    }
  } catch (error) {
    console.error('[Storage] Error saving home genres:', error);
    throw error;
  }
};

/**
 * Check if user has completed onboarding
 * Onboarding is complete when:
 * 1. User profile exists (name, email)
 * 2. User preferences exist (region, platforms)
 * 3. At least one platform is selected
 * @returns {Promise<boolean>} True if onboarding is complete
 */
export const hasCompletedOnboarding = async () => {
  try {
    const profile = await getUserProfile();
    const preferences = await getUserPreferences();

    // Check profile exists with required fields
    const hasProfile = !!(
      profile &&
      profile.userId &&
      profile.name &&
      profile.email
    );

    // Check preferences exist with region and platforms
    const hasPreferences = !!(
      preferences &&
      preferences.region &&
      preferences.platforms &&
      Array.isArray(preferences.platforms)
    );

    // Check at least one platform is selected
    const hasPlatforms = preferences?.platforms?.length > 0;

    const isComplete = hasProfile && hasPreferences && hasPlatforms;

    if (DEBUG) {
      console.log('[Storage] Onboarding status:', {
        hasProfile,
        hasPreferences,
        hasPlatforms,
        isComplete,
      });
    }

    return isComplete;
  } catch (error) {
    console.error('[Storage] Error checking onboarding status:', error);
    return false;
  }
};

/**
 * Clear all user data (profile and preferences)
 * Use when user logs out or resets app
 * @returns {Promise<void>}
 */
export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_PROFILE,
      STORAGE_KEYS.USER_PREFERENCES,
    ]);

    if (DEBUG) {
      console.log('[Storage] All user data cleared');
    }
  } catch (error) {
    console.error('[Storage] Error clearing user data:', error);
    throw error;
  }
};

// Export storage keys for direct access if needed
export { STORAGE_KEYS };

// Default export with all functions
export default {
  saveUserProfile,
  getUserProfile,
  saveUserPreferences,
  getUserPreferences,
  getSelectedPlatforms,
  getHomeGenres,
  setHomeGenres,
  hasCompletedOnboarding,
  clearAllData,
  STORAGE_KEYS,
  DEFAULT_HOME_GENRES,
};
