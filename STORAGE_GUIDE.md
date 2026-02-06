# User Storage Guide

## Overview

The storage system manages user profile and preferences using AsyncStorage. This guide covers all storage operations for the V1 prototype.

## Storage Keys

```javascript
{
  USER_PROFILE: '@user_profile',
  USER_PREFERENCES: '@user_preferences'
}
```

## Data Structures

### User Profile

```javascript
{
  userId: "550e8400-e29b-41d4-a716-446655440000",  // UUID
  name: "John Smith",                               // User's name
  email: "john@example.com",                        // User's email
  createdAt: 1706554800000                          // Timestamp
}
```

### User Preferences

```javascript
{
  region: "GB",                                     // Region code
  platforms: [                                      // Selected platforms
    {
      id: 8,                                        // Platform ID (TMDb)
      name: "Netflix",                              // Platform name
      selected: true                                // Selection state
    },
    {
      id: 350,
      name: "Apple TV+",
      selected: true
    }
  ]
}
```

---

## Functions

### saveUserProfile(profile)

Save user profile data from onboarding (Screen 1).

**Parameters:**
```javascript
{
  userId: string,     // Required - UUID
  name: string,       // Required - User's name
  email: string,      // Required - User's email
  createdAt: number   // Optional - Auto-generated if not provided
}
```

**Example:**
```javascript
import { saveUserProfile } from './src/storage/userPreferences';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const profile = {
  userId: uuidv4(),
  name: 'John Smith',
  email: 'john@example.com',
};

await saveUserProfile(profile);
// [Storage] User profile saved: 550e8400-e29b-41d4-a716-446655440000
```

**Validation:**
- Throws error if `userId`, `name`, or `email` is missing
- Automatically adds `createdAt` timestamp if not provided

---

### getUserProfile()

Retrieve user profile.

**Returns:** Profile object or `null` if not found

**Example:**
```javascript
import { getUserProfile } from './src/storage/userPreferences';

const profile = await getUserProfile();

if (profile) {
  console.log('User:', profile.name, profile.email);
} else {
  console.log('No profile found - show onboarding');
}
```

---

### saveUserPreferences(preferences)

Save user preferences from onboarding (Screens 2 & 3).

**Parameters:**
```javascript
{
  region: string,               // Required - Region code (e.g., 'GB')
  platforms: Array<{            // Required - Platform array
    id: number,
    name: string,
    selected: boolean
  }>
}
```

**Example:**
```javascript
import { saveUserPreferences } from './src/storage/userPreferences';

const preferences = {
  region: 'GB',
  platforms: [
    { id: 8, name: 'Netflix', selected: true },
    { id: 350, name: 'Apple TV+', selected: true },
    { id: 337, name: 'Disney+', selected: true },
  ],
};

await saveUserPreferences(preferences);
// [Storage] User preferences saved: GB 3 platforms
```

**Validation:**
- Throws error if `region` is missing
- Throws error if `platforms` is not an array

---

### getUserPreferences()

Retrieve user preferences.

**Returns:** Preferences object or `null` if not found

**Example:**
```javascript
import { getUserPreferences } from './src/storage/userPreferences';

const preferences = await getUserPreferences();

if (preferences) {
  console.log('Region:', preferences.region);
  console.log('Platforms:', preferences.platforms.length);
}
```

---

### getSelectedPlatforms()

Get array of selected platform IDs (for API queries).

**Returns:** Array of platform IDs (numbers)

**Example:**
```javascript
import { getSelectedPlatforms } from './src/storage/userPreferences';
import { discoverMovies } from './src/api/tmdb';

// Get user's selected platforms
const platformIds = await getSelectedPlatforms();
// [8, 350, 337]

// Use in API query
const result = await discoverMovies({
  with_watch_providers: platformIds.join('|'),
  page: 1,
});
// Fetches movies available on Netflix, Apple TV+, or Disney+
```

**Filtering:**
- Automatically filters out platforms with `selected: false`
- Returns empty array if no preferences found

---

### hasCompletedOnboarding()

Check if user has completed the 3-screen onboarding flow.

**Returns:** `true` if onboarding complete, `false` otherwise

**Checks:**
1. ✅ User profile exists (userId, name, email)
2. ✅ User preferences exist (region, platforms array)
3. ✅ At least one platform is selected

**Example:**
```javascript
import { hasCompletedOnboarding } from './src/storage/userPreferences';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const complete = await hasCompletedOnboarding();
      setOnboardingComplete(complete);
      setLoading(false);
    };

    checkOnboarding();
  }, []);

  if (loading) return <LoadingScreen />;

  return onboardingComplete ? <MainApp /> : <OnboardingFlow />;
};
```

**Debug Output:**
```javascript
[Storage] Onboarding status: {
  hasProfile: true,
  hasPreferences: true,
  hasPlatforms: true,
  isComplete: true
}
```

---

### clearAllData()

Clear all user data (profile and preferences). Use when user logs out or resets app.

**Example:**
```javascript
import { clearAllData } from './src/storage/userPreferences';

const handleLogout = async () => {
  await clearAllData();
  // [Storage] All user data cleared

  // Navigate to onboarding
  navigation.reset({
    index: 0,
    routes: [{ name: 'Onboarding' }],
  });
};
```

---

## Complete Onboarding Flow

### Screen 1: Welcome & Signup

```javascript
import { saveUserProfile } from './src/storage/userPreferences';
import { v4 as uuidv4 } from 'uuid';

const WelcomeScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleContinue = async () => {
    // Validate inputs
    if (!name.trim() || name.length < 2) {
      Alert.alert('Error', 'Name must be at least 2 characters');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    // Save profile
    try {
      await saveUserProfile({
        userId: uuidv4(),
        name: name.trim(),
        email: email.trim(),
      });

      navigation.navigate('LocationSelection');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <Button title="Continue" onPress={handleContinue} />
    </View>
  );
};
```

---

### Screen 2: Location Selection

```javascript
const LocationScreen = ({ navigation }) => {
  const [region] = useState('GB'); // Default UK for V1

  const handleNext = () => {
    // Store region temporarily, save with platforms in Screen 3
    navigation.navigate('PlatformSelection', { region });
  };

  return (
    <View>
      <Text>Where are you located?</Text>
      <Text>United Kingdom</Text>
      <Button title="Next" onPress={handleNext} />
    </View>
  );
};
```

---

### Screen 3: Platform Selection

```javascript
import { saveUserPreferences } from './src/storage/userPreferences';
import { UK_PROVIDERS_ARRAY } from './src/constants/platforms';

const PlatformSelectionScreen = ({ route, navigation }) => {
  const { region } = route.params;
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);

  const togglePlatform = (platform) => {
    setSelectedPlatforms(prev => {
      const exists = prev.find(p => p.id === platform.id);
      if (exists) {
        return prev.filter(p => p.id !== platform.id);
      } else {
        return [...prev, { ...platform, selected: true }];
      }
    });
  };

  const handleStartBrowsing = async () => {
    if (selectedPlatforms.length === 0) {
      Alert.alert('Error', 'Please select at least one platform');
      return;
    }

    try {
      await saveUserPreferences({
        region,
        platforms: selectedPlatforms,
      });

      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences');
    }
  };

  return (
    <View>
      <Text>Which services do you subscribe to?</Text>
      <FlatList
        data={UK_PROVIDERS_ARRAY}
        numColumns={2}
        renderItem={({ item }) => (
          <PlatformCard
            platform={item}
            selected={!!selectedPlatforms.find(p => p.id === item.id)}
            onPress={() => togglePlatform(item)}
          />
        )}
      />
      <Button
        title="Start Browsing"
        onPress={handleStartBrowsing}
        disabled={selectedPlatforms.length === 0}
      />
    </View>
  );
};
```

---

## Using Preferences in Main App

### Browse Screen

```javascript
import { getSelectedPlatforms } from './src/storage/userPreferences';
import { discoverMovies } from './src/api/tmdb';

const BrowseScreen = () => {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const fetchMovies = async () => {
      // Get user's selected platforms
      const platformIds = await getSelectedPlatforms();

      // Fetch movies from those platforms
      const result = await discoverMovies({
        with_watch_providers: platformIds.join('|'),
        page: 1,
      });

      if (result.success) {
        setMovies(result.data.results);
      }
    };

    fetchMovies();
  }, []);

  return (
    <FlatList
      data={movies}
      renderItem={({ item }) => <MovieCard movie={item} />}
    />
  );
};
```

---

### Profile Screen

```javascript
import {
  getUserProfile,
  getUserPreferences,
  clearAllData
} from './src/storage/userPreferences';

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const userProfile = await getUserProfile();
      const userPrefs = await getUserPreferences();

      setProfile(userProfile);
      setPreferences(userPrefs);
    };

    loadData();
  }, []);

  const handleReset = async () => {
    Alert.alert(
      'Reset App',
      'This will clear all your data and restart onboarding.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Onboarding' }],
            });
          },
        },
      ]
    );
  };

  return (
    <View>
      <Text>Name: {profile?.name}</Text>
      <Text>Email: {profile?.email}</Text>
      <Text>Region: {preferences?.region}</Text>
      <Text>Platforms: {preferences?.platforms.length}</Text>

      <Button title="Reset App" onPress={handleReset} />
    </View>
  );
};
```

---

## Debug Logging

All storage operations are logged in development mode:

```
[Storage] User profile saved: 550e8400-e29b-41d4-a716-446655440000
[Storage] User preferences saved: GB 3 platforms
[Storage] User profile retrieved: 550e8400-e29b-41d4-a716-446655440000
[Storage] User preferences retrieved: GB 3 platforms
[Storage] Selected platforms: [8, 350, 337]
[Storage] Onboarding status: { hasProfile: true, hasPreferences: true, hasPlatforms: true, isComplete: true }
[Storage] All user data cleared
```

---

## Error Handling

All functions handle errors gracefully:

```javascript
// saveUserProfile throws on validation error
try {
  await saveUserProfile({ name: 'John' }); // Missing userId and email
} catch (error) {
  console.error(error.message);
  // "Profile must include userId, name, and email"
}

// getUserProfile returns null on error
const profile = await getUserProfile();
if (!profile) {
  // Handle missing profile
}

// getSelectedPlatforms returns empty array on error
const platforms = await getSelectedPlatforms(); // []
```

---

## Data Persistence

**AsyncStorage is persistent:**
- Data survives app restarts
- Data survives app updates
- Only cleared by:
  - `clearAllData()` function
  - Uninstalling app
  - Manual storage clear

**Storage size:**
- Profile: ~100-200 bytes
- Preferences: ~500-1000 bytes
- **Total: ~1 KB** (minimal footprint)

---

## Testing Storage

### Test Storage Functions

```javascript
import {
  saveUserProfile,
  getUserProfile,
  saveUserPreferences,
  getSelectedPlatforms,
  hasCompletedOnboarding,
  clearAllData,
} from './src/storage/userPreferences';
import { v4 as uuidv4 } from 'uuid';

// Test profile
await saveUserProfile({
  userId: uuidv4(),
  name: 'Test User',
  email: 'test@example.com',
});

const profile = await getUserProfile();
console.log('Profile:', profile);

// Test preferences
await saveUserPreferences({
  region: 'GB',
  platforms: [
    { id: 8, name: 'Netflix', selected: true },
    { id: 350, name: 'Apple TV+', selected: true },
  ],
});

const platforms = await getSelectedPlatforms();
console.log('Platform IDs:', platforms); // [8, 350]

// Test onboarding check
const complete = await hasCompletedOnboarding();
console.log('Onboarding complete:', complete); // true

// Test clear
await clearAllData();
const profileAfter = await getUserProfile();
console.log('Profile after clear:', profileAfter); // null
```

---

## Best Practices

### 1. Validate Before Saving

```javascript
// ❌ Don't save without validation
await saveUserProfile({ name: formData.name });

// ✅ Validate first
if (!formData.name || !formData.email) {
  Alert.alert('Error', 'Please fill all fields');
  return;
}
await saveUserProfile({
  userId: uuidv4(),
  name: formData.name,
  email: formData.email,
});
```

### 2. Handle Missing Data

```javascript
// ❌ Don't assume data exists
const profile = await getUserProfile();
console.log(profile.name); // Crash if null

// ✅ Check for null
const profile = await getUserProfile();
if (profile) {
  console.log(profile.name);
} else {
  // Show onboarding
}
```

### 3. Use TypeScript Types (Optional)

```typescript
interface UserProfile {
  userId: string;
  name: string;
  email: string;
  createdAt: number;
}

interface UserPreferences {
  region: string;
  platforms: Array<{
    id: number;
    name: string;
    selected: boolean;
  }>;
}
```

---

---

## Watchlist Storage

The watchlist system stores user's saved content with status tracking and ratings.

### Storage Keys

```javascript
{
  WATCHLIST: '@app_watchlist',
  RECOMMENDATIONS: '@app_recommendations',
  DISMISSED: '@app_dismissed_recommendations'
}
```

### Watchlist Item Schema

```javascript
{
  id: 550,                           // TMDb ID
  type: 'movie',                     // 'movie' or 'tv'
  status: 'watched',                 // 'want_to_watch' or 'watched'
  rating: 1,                         // -1 (dislike), 0 (neutral), 1 (like)
  addedAt: 1706554800000,           // When added
  updatedAt: 1706558400000,         // Last modified
  watchedAt: 1706558400000,         // When marked watched (null if want_to_watch)
  metadata: {
    title: 'Fight Club',
    posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    backdropPath: '/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg',
    overview: 'A ticking-time-bomb insomniac...',
    releaseDate: '1999-10-15',
    voteAverage: 8.4,
    genreIds: [18, 53],
    runtime: 139,
    numberOfSeasons: null
  },
  // Sync-ready fields
  syncStatus: 'local_only',         // 'synced', 'pending_sync', 'local_only'
  lastSyncedAt: null,
  version: 1
}
```

### Watchlist Functions

```javascript
import {
  getWatchlist,
  getWatchlistItem,
  addToWatchlist,
  updateWatchlistItem,
  removeFromWatchlist,
  setWatchlistStatus,
  setWatchlistRating,
  getWatchlistByStatus,
  getWatchlistStats,
  isInWatchlist,
} from './src/storage/watchlist';

// Add item to watchlist
await addToWatchlist(550, 'movie', {
  title: 'Fight Club',
  posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  genreIds: [18, 53],
  voteAverage: 8.4,
}, 'want_to_watch');

// Check if in watchlist
const inList = await isInWatchlist(550, 'movie'); // true

// Change status to watched
await setWatchlistStatus(550, 'movie', 'watched');

// Rate the content
await setWatchlistRating(550, 'movie', 1); // thumbs up

// Get all watched items
const watched = await getWatchlistByStatus('watched');

// Get watchlist statistics
const stats = await getWatchlistStats();
// { total: 12, wantToWatch: 5, watched: 7, liked: 4, disliked: 1, movies: 8, tvShows: 4 }

// Remove from watchlist
await removeFromWatchlist(550, 'movie');
```

---

## Recommendations Storage

The recommendations system caches generated recommendations and tracks dismissed items.

### Recommendation Cache Schema

```javascript
{
  recommendations: [/* RecommendationItem[] */],
  generatedAt: 1706554800000,
  expiresAt: 1706576400000,    // +6 hours
  basedOn: {
    genreAffinities: { 18: 5, 53: 3 },
    likedItemIds: [550, 680]
  },
  schemaVersion: 1
}
```

### Dismissed Item Schema

```javascript
{
  items: [
    { id: 123, type: 'movie', dismissedAt: 1706554800000 }
  ],
  schemaVersion: 1
}
```

### Recommendations Functions

```javascript
import {
  getCachedRecommendations,
  setCachedRecommendations,
  isRecommendationCacheValid,
  clearRecommendationCache,
  dismissRecommendation,
  getDismissedIds,
  cleanExpiredDismissals,
} from './src/storage/recommendations';

// Check if cache is valid (< 6 hours old)
const isValid = await isRecommendationCacheValid();

// Dismiss a recommendation (won't show for 30 days)
await dismissRecommendation(123, 'movie');

// Get dismissed IDs for filtering
const dismissed = await getDismissedIds();
// Set { 'movie-123', 'tv-456' }

// Clean expired dismissals (> 30 days old)
await cleanExpiredDismissals();
```

---

## Recommendation Engine

Generate personalized recommendations using the recommendation engine.

```javascript
import { generateRecommendations } from './src/utils/recommendationEngine';

// Generate recommendations (uses cache if valid)
const recommendations = await generateRecommendations(platformIds, 'GB');

// Each recommendation includes:
// {
//   id: 456,
//   type: 'movie',
//   score: 78.5,
//   reason: 'Because you like Drama',
//   source: 'genre',
//   metadata: { title: '...', posterPath: '...', ... }
// }
```

### Algorithm Overview

1. **Genre Affinity (70%)**: Scores genres based on watchlist items
   - Watched + thumbs up: +3 points
   - Watched + neutral: +1 point
   - Watched + thumbs down: -1 point
   - Want to watch: +1 point

2. **Similar Content (30%)**: Fetches similar content for top 3 liked items

3. **Diversity Filter**: Max 3 items per genre in top 10 results

---

## Summary

✅ **Simple API** - 7 functions for user preferences, 10+ for watchlist
✅ **Validated inputs** - Prevents invalid data
✅ **Debug logging** - Track all operations
✅ **Error handling** - Graceful failures
✅ **Minimal storage** - ~1 KB per user (preferences), variable for watchlist
✅ **Sync-ready** - Schema includes sync metadata for future backend integration
✅ **Production ready** - No additional configuration

The storage system handles all V1 requirements without complexity! 🚀
