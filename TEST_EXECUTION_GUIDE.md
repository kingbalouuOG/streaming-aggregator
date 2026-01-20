# Test Execution Guide

## Purpose
This guide provides step-by-step instructions for testing StreamFinder app. Follow this guide to ensure comprehensive testing coverage.

## Pre-Test Setup

### 1. Environment Configuration
```bash
# Ensure environment variables are set
# Create .env file in project root if not exists:
TMDB_API_KEY=your_tmdb_api_key_here
OMDB_API_KEY=your_omdb_api_key_here
```

### 2. Clear Previous Test Data
**Android:**
```bash
# Clear app data
adb shell pm clear com.streamfinder

# Or manually: Settings > Apps > StreamFinder > Clear Data
```

**iOS:**
```bash
# Uninstall and reinstall app
# Or use Simulator: Device > Erase All Content and Settings
```

### 3. Enable Debug Logging
```javascript
// Check __DEV__ is true for development builds
console.log('Debug mode:', __DEV__); // Should be true
```

---

## Test Execution Steps

## Phase 1: Fresh Install & Onboarding (15 mins)

### Step 1.1: Initial Launch
1. Install app on test device
2. Launch app
3. **Verify:**
   - App opens without crash
   - Splash screen displays (if implemented)
   - WelcomeScreen appears
4. **Expected:** Clean first launch
5. **Pass/Fail:** _______

### Step 1.2: Welcome Screen
1. Observe WelcomeScreen UI
2. Try tapping "Continue" without input
3. **Verify:**
   - Button is disabled
   - No navigation occurs
4. Enter name: "A" (1 character)
5. **Verify:**
   - Error message appears: "Name must be at least 2 characters"
6. Enter name: "Test User"
7. Enter email: "invalid" (no @)
8. **Verify:**
   - Error message appears: "Please enter a valid email"
9. Enter email: "test@example.com"
10. **Verify:**
    - Errors cleared
    - Continue button enabled
11. Tap "Continue"
12. **Verify:**
    - Navigation to LocationScreen
    - Keyboard dismissed
13. **Pass/Fail:** _______

### Step 1.3: Location Screen
1. Observe LocationScreen UI
2. **Verify:**
   - UK flag emoji visible: 🇬🇧
   - Title: "United Kingdom"
   - Description present
   - Continue button present
3. Tap "Continue"
4. **Verify:**
   - Navigation to PlatformsScreen
5. **Pass/Fail:** _______

### Step 1.4: Platforms Screen
1. Observe PlatformsScreen UI
2. **Verify:**
   - Header: "Which services do you subscribe to?"
   - 8 platform cards in 2 columns
   - All platforms visible:
     * Netflix
     * Amazon Prime Video
     * Apple TV+
     * Disney+
     * Now TV
     * BBC iPlayer
     * ITVX
     * Channel 4
3. Try tapping "Start Browsing" without selection
4. **Verify:**
   - Button is disabled or no action
5. Tap "Netflix" card
6. **Verify:**
   - Card border changes to accent color (#FF375F)
   - Selected state visible
7. Tap "Netflix" again
8. **Verify:**
   - Deselected (border returns to default)
9. Select 3 platforms: Netflix, Disney+, Apple TV+
10. **Verify:**
    - All 3 show selected state
    - Start Browsing button enabled
11. Tap "Start Browsing"
12. **Verify:**
    - Navigation to HomeScreen
    - Loading indicator appears
13. **Pass/Fail:** _______

### Step 1.5: Verify Data Persistence
1. Force close app (swipe up from recent apps)
2. Wait 5 seconds
3. Reopen app
4. **Verify:**
   - App opens directly to HomeScreen
   - No onboarding screens shown
   - Selected platforms remembered
5. Open AsyncStorage (React Native Debugger or logs)
6. **Verify:**
   - User profile saved
   - Platform preferences saved
7. **Pass/Fail:** _______

---

## Phase 2: Home Screen Testing (20 mins)

### Step 2.1: Layout & Initial Load
1. Observe HomeScreen
2. **Verify:**
   - Glass header with "StreamFinder" title
   - Filter chips: All, Movies, TV, Documentaries
   - Content sections loading or loaded:
     * Popular on Your Services
     * Recently Added
     * Action
     * Comedy
     * Drama
3. Wait for content to load (max 5 seconds)
4. **Verify:**
   - All sections populated with content cards
   - No error messages
   - Loading indicators disappeared
5. **Pass/Fail:** _______

### Step 2.2: Content Cards
1. Observe first content card
2. **Verify:**
   - Poster image loads (blur → sharp effect)
   - Platform badge(s) visible (top right)
   - Title overlay readable (bottom)
   - Card has glass effect border
3. Scroll horizontally in "Popular" section
4. **Verify:**
   - Smooth scrolling
   - More cards load
   - Images load progressively
5. **Pass/Fail:** _______

### Step 2.3: Filtering
1. Tap "Movies" filter chip
2. **Verify:**
   - Chip background changes to accent color
   - Loading indicator appears
   - Content reloads
   - Only movie content shown (check titles)
3. Tap "TV" filter chip
4. **Verify:**
   - Previous filter deselected
   - TV content loads
   - Only TV shows visible
5. Tap "Documentaries" filter
6. **Verify:**
   - Documentary content loads
7. Tap "All" filter
8. **Verify:**
   - Mixed content (movies + TV)
9. **Pass/Fail:** _______

### Step 2.4: Navigation to Details
1. Tap any content card
2. **Verify:**
   - Press animation (scale/opacity change)
   - Navigation to DetailScreen
   - Correct content loads
3. Tap back button
4. **Verify:**
   - Return to HomeScreen
   - Scroll position maintained
   - Same content visible
5. **Pass/Fail:** _______

### Step 2.5: Vertical Scrolling
1. Scroll down through all sections
2. **Verify:**
   - Smooth 60 FPS scrolling
   - All sections visible
   - Content loads as needed
   - No blank spaces or errors
3. Scroll back to top
4. **Verify:**
   - Header still visible
   - Filters still functional
5. **Pass/Fail:** _______

---

## Phase 3: Browse & Search Testing (25 mins)

### Step 3.1: Browse Screen Initial State
1. Navigate to Browse tab (bottom navigation)
2. **Verify:**
   - Search bar at top
   - Filter chips: All, Movies, TV
   - Content grid (2 columns)
   - Content loading or loaded
3. **Pass/Fail:** _______

### Step 3.2: Content Grid
1. Observe content grid
2. **Verify:**
   - 2 columns of cards
   - Equal spacing
   - Cards aligned properly
   - Images loading progressively
3. Scroll down
4. **Verify:**
   - Smooth scrolling
   - More content loads (pagination)
   - Loading indicator in footer
5. **Pass/Fail:** _______

### Step 3.3: Search Functionality
1. Tap search bar
2. **Verify:**
   - Keyboard appears
   - Cursor in search field
3. Type "Stranger" (partial query)
4. Wait 300ms
5. **Verify:**
   - Search didn't trigger yet (debouncing)
6. Wait another 100ms (400ms total)
7. **Verify:**
   - Search triggered
   - Loading indicator appears
   - Results display
8. **Pass/Fail:** _______

### Step 3.4: Search Results
1. Continue typing: "Stranger Things"
2. Wait for results
3. **Verify:**
   - "Stranger Things" appears in results
   - Platform badges shown
   - Can tap to view details
4. Observe search bar
5. **Verify:**
   - Clear button (X) visible
6. Tap clear button
7. **Verify:**
   - Search text cleared
   - Returns to browse content
   - Grid repopulates
8. **Pass/Fail:** _______

### Step 3.5: Search Filters
1. Search for "Batman"
2. Wait for results
3. **Verify:**
   - Mix of movies and TV shows
4. Tap "Movies" filter
5. **Verify:**
   - Only Batman movies shown
   - TV shows filtered out
6. Tap "TV" filter
7. **Verify:**
   - Only Batman TV shows
   - Movies filtered out
8. Tap "All" filter
9. **Verify:**
   - Both movies and TV shows
10. **Pass/Fail:** _______

### Step 3.6: Search Edge Cases
1. Search for empty string ""
2. **Verify:**
   - Browse content shows
   - No error
3. Search for "xyzabc123xyz" (no results)
4. **Verify:**
   - Empty state displays
   - Icon and message shown
   - "No results found" text
   - Helpful suggestion
5. Search for special chars: "batman & robin"
6. **Verify:**
   - Search works
   - Results show
   - No crash
7. **Pass/Fail:** _______

### Step 3.7: Search Pagination
1. Search for common term: "the"
2. Wait for results
3. Scroll to bottom
4. **Verify:**
   - More results load
   - Loading indicator in footer
   - New results append
   - No duplicates
5. **Pass/Fail:** _______

---

## Phase 4: Detail Screen Testing (20 mins)

### Step 4.1: Navigation to Details
1. From HomeScreen or BrowseScreen
2. Tap any content card
3. **Verify:**
   - Navigation to DetailScreen
   - Loading indicator appears
4. Wait for content to load
5. **Verify:**
   - All sections load
   - No errors
6. **Pass/Fail:** _______

### Step 4.2: Layout & Content
1. Observe DetailScreen
2. **Verify:**
   - Backdrop image at top (full width)
   - Gradient overlay on backdrop
   - Glass back button (top left)
   - Poster image (150px wide)
   - Title below poster
   - Metadata row: Year • Runtime • Rating
   - Rating badges (RT and/or IMDb)
   - Synopsis text
   - "Available on:" section
   - Platform chips
   - Cast section with horizontal scroll
3. **Pass/Fail:** _______

### Step 4.3: Images
1. Check backdrop image
2. **Verify:**
   - High quality (w1280)
   - No pixelation
3. Check poster image
4. **Verify:**
   - Good quality (w500)
   - Loads progressively
5. Scroll to cast section
6. **Verify:**
   - Cast photos load
   - Placeholders for missing photos
7. **Pass/Fail:** _______

### Step 4.4: Data Accuracy
1. Verify metadata
2. **Check:**
   - Year is correct
   - Runtime makes sense
   - Rating appropriate
3. Verify ratings
4. **Check:**
   - RT score is percentage
   - IMDb score is out of 10
   - Icons show correctly
5. Verify synopsis
6. **Check:**
   - Text is readable
   - Complete sentences
7. **Pass/Fail:** _______

### Step 4.5: Cast Section
1. Scroll cast list horizontally
2. **Verify:**
   - Smooth scrolling
   - All cast members load
   - Photos display or placeholder
   - Actor names visible
   - Character names visible
3. **Pass/Fail:** _______

### Step 4.6: Platform Availability
1. Check "Available on:" section
2. **Verify:**
   - Shows UK platforms only
   - Platform chips display
   - Multiple platforms shown if available
3. **Pass/Fail:** _______

### Step 4.7: Navigation
1. Tap back button
2. **Verify:**
   - Returns to previous screen
   - Previous scroll position maintained
3. Navigate to DetailScreen again
4. Swipe from left edge (iOS) or press back (Android)
5. **Verify:**
   - Gesture navigation works
6. **Pass/Fail:** _______

---

## Phase 5: Edge Case Testing (30 mins)

### Test 5.1: No Internet Connection
1. Turn off WiFi and mobile data
2. Close and reopen app
3. **Verify:**
   - Cached content displays
   - No crash
4. Try to load new content
5. **Verify:**
   - Network error message shows
   - "Connection Error" title
   - Retry button appears
6. Turn on internet
7. Tap retry button
8. **Verify:**
   - Content loads successfully
9. **Pass/Fail:** _______

### Test 5.2: Slow Network
1. Enable network throttling:
   - iOS: Settings > Developer > Network Link Conditioner > 3G
   - Android: Use Chrome DevTools remote debugging
2. Navigate between screens
3. **Verify:**
   - Loading indicators show
   - User can still navigate
   - Eventually loads or times out gracefully
4. **Pass/Fail:** _______

### Test 5.3: Empty States
1. Go to PlatformsScreen (reset app data if needed)
2. Deselect all platforms
3. Save and go to HomeScreen
4. **Verify:**
   - Empty state shows
   - "No Platforms Selected" message
   - Helpful instructions
   - No crash
5. **Pass/Fail:** _______

### Test 5.4: Rapid Interactions
1. Rapidly tap between tabs
2. **Verify:**
   - No double navigation
   - No crash
   - App remains responsive
3. Rapidly change filters
4. **Verify:**
   - Stale requests cancelled
   - Latest filter loads
   - No mixed results
5. Rapidly scroll up and down
6. **Verify:**
   - Smooth scrolling
   - Images still load
   - No blank cards
7. **Pass/Fail:** _______

### Test 5.5: Background/Foreground
1. App running on HomeScreen
2. Press home button (background app)
3. Wait 10 seconds
4. Reopen app
5. **Verify:**
   - App resumes immediately
   - Content still visible
   - No crash
6. Background for 5 minutes
7. Reopen app
8. **Verify:**
   - App resumes
   - May refresh data
   - State preserved
9. **Pass/Fail:** _______

### Test 5.6: Memory Pressure
1. Open multiple apps
2. Return to StreamFinder
3. **Verify:**
   - App still functional
   - May have released memory
   - Can reload data if needed
4. Navigate through app
5. **Verify:**
   - No crash
   - Performance acceptable
6. **Pass/Fail:** _______

---

## Phase 6: Platform-Specific Testing (20 mins per platform)

### Android Specific Tests

#### Test 6A.1: Back Button
1. Navigate: Home → Browse → Detail
2. Press Android back button
3. **Verify:**
   - Returns to Browse
4. Press back button again
5. **Verify:**
   - Returns to Home
6. **Pass/Fail:** _______

#### Test 6A.2: App Switching
1. Open recent apps (square button)
2. Switch to another app
3. Switch back to StreamFinder
4. **Verify:**
   - App resumes correctly
5. **Pass/Fail:** _______

#### Test 6A.3: Screen Sizes
Test on different Android devices:
1. Small phone (5")
2. **Verify:**
   - All content visible
   - No overflow
   - Buttons accessible
   - Text readable
3. Large phone (6.5")
4. **Verify:**
   - Layout scales
   - No wasted space
5. **Pass/Fail:** _______

### iOS Specific Tests

#### Test 6B.1: Swipe Gestures
1. Navigate to DetailScreen
2. Swipe from left edge
3. **Verify:**
   - Returns to previous screen
4. **Pass/Fail:** _______

#### Test 6B.2: Dynamic Island (iPhone 14 Pro)
1. Test on iPhone 14 Pro/Pro Max
2. Navigate through app
3. **Verify:**
   - No content hidden by Dynamic Island
   - Safe area respected
4. **Pass/Fail:** _______

#### Test 6B.3: Notch Handling
1. Test on iPhone with notch
2. **Verify:**
   - Status bar content visible
   - Safe area insets correct
   - No overlap with notch
3. **Pass/Fail:** _______

---

## Phase 7: Performance Testing (15 mins)

### Test 7.1: Load Times
Use stopwatch or performance tools:
1. Measure app launch time
   - **Target:** < 2 seconds
   - **Actual:** _______ seconds
2. Measure screen navigation
   - **Target:** < 300ms
   - **Actual:** _______ ms
3. Measure image load time
   - **Target:** < 500ms perceived
   - **Actual:** _______ ms
4. **Pass/Fail:** _______

### Test 7.2: Memory Usage
Use Xcode Instruments or Android Profiler:
1. Record initial memory
   - **Target:** < 80MB
   - **Actual:** _______ MB
2. Browse for 5 minutes
3. Record memory
   - **Target:** < 150MB
   - **Actual:** _______ MB
4. **Pass/Fail:** _______

### Test 7.3: Scroll Performance
Use development tools to measure FPS:
1. Scroll through long list
2. Measure frame rate
   - **Target:** 60 FPS
   - **Actual:** _______ FPS
3. **Pass/Fail:** _______

---

## Post-Test Actions

### 1. Document Issues
Use ISSUE_TEMPLATE.md to document any bugs found

### 2. Submit Test Report
Fill out test results in TESTING_CHECKLIST.md

### 3. Developer Handoff
- Priority 1 (Critical): Immediate fix needed
- Priority 2 (Major): Fix before release
- Priority 3 (Minor): Fix if time permits
- Priority 4 (Enhancement): Future consideration

---

## Test Sign-Off

**Tester Name:** _______________________
**Date:** _______________________
**Signature:** _______________________

**Result:**
- [ ] PASS - All tests passed, ready for release
- [ ] PASS WITH NOTES - Minor issues documented
- [ ] FAIL - Critical issues found, retest needed

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________
