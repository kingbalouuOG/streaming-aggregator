# StreamFinder Testing Checklist

## Test Environment Setup

### Prerequisites
- [ ] Device/Emulator with Android 8.0+ or iOS 13+
- [ ] Valid TMDb API key configured
- [ ] Valid OMDB API key configured
- [ ] Internet connection available
- [ ] Development build installed

### Test Devices
- [ ] Android Phone (5.5" - 1080x1920)
- [ ] Android Phone (6.5" - 1440x3040)
- [ ] Android Tablet (10" - 1920x1200)
- [ ] iPhone SE (4.7" - 750x1334)
- [ ] iPhone 14 (6.1" - 1170x2532)
- [ ] iPhone 14 Pro Max (6.7" - 1290x2796)

---

## 1. Fresh Install Testing

### 1.1 Initial App Launch
- [ ] App launches without crash
- [ ] Splash screen displays correctly
- [ ] No console errors on launch
- [ ] Memory usage normal (< 100MB)

### 1.2 Onboarding Flow

#### WelcomeScreen
- [ ] App name "StreamFinder" displays correctly
- [ ] Tagline visible
- [ ] Name input field works
- [ ] Email input field works
- [ ] Validation: Name < 2 chars shows error
- [ ] Validation: Invalid email shows error
- [ ] Continue button disabled until valid
- [ ] Continue button enabled when valid
- [ ] Keyboard dismisses on continue
- [ ] Navigation to LocationScreen works

#### LocationScreen
- [ ] UK flag emoji displays
- [ ] "United Kingdom" text visible
- [ ] Description text visible
- [ ] Continue button works
- [ ] Navigation to PlatformsScreen works

#### PlatformsScreen
- [ ] Header text displays
- [ ] All 8 platforms show:
  - [ ] Netflix
  - [ ] Amazon Prime Video
  - [ ] Apple TV+
  - [ ] Disney+
  - [ ] Now TV
  - [ ] BBC iPlayer
  - [ ] ITVX
  - [ ] Channel 4
- [ ] Cards arranged in 2 columns
- [ ] Tap to select/deselect works
- [ ] Selected state shows accent border
- [ ] Start Browsing button disabled with no selection
- [ ] Start Browsing button enabled with selection
- [ ] Multiple selections work
- [ ] Navigation to HomeScreen works
- [ ] User preferences saved to AsyncStorage

### 1.3 Verify Data Persistence
- [ ] Close app completely
- [ ] Reopen app
- [ ] User goes directly to HomeScreen (no onboarding)
- [ ] Selected platforms remembered
- [ ] User name stored
- [ ] User email stored

---

## 2. Core Functionality Testing

### 2.1 HomeScreen

#### Layout & UI
- [ ] Glass header displays
- [ ] "StreamFinder" title visible
- [ ] Filter chips render (All, Movies, TV, Documentaries)
- [ ] All content sections load:
  - [ ] Popular on Your Services
  - [ ] Recently Added
  - [ ] Action
  - [ ] Comedy
  - [ ] Drama
- [ ] Content cards display properly
- [ ] Platform badges show on cards
- [ ] Title overlays readable
- [ ] Horizontal scrolling smooth
- [ ] Vertical scrolling smooth

#### Filtering
- [ ] "All" filter shows movies + TV
- [ ] "Movies" filter shows only movies
- [ ] "TV" filter shows only TV shows
- [ ] "Documentaries" filter shows documentaries
- [ ] Content reloads on filter change
- [ ] Loading indicator shows during filter change

#### Content Cards
- [ ] Poster images load progressively
- [ ] Blur-to-sharp effect works
- [ ] Platform badges show (max 3 + count)
- [ ] Title overlay readable on all images
- [ ] Tap animation works (scale 0.95, opacity 0.8)
- [ ] Tap navigates to DetailScreen
- [ ] Cards memoized (no flicker on scroll)

#### Performance
- [ ] Initial load < 2 seconds
- [ ] Smooth 60 FPS scrolling
- [ ] No jank during image loading
- [ ] Memory stable (< 120MB after 2 min)

### 2.2 BrowseScreen

#### Layout & UI
- [ ] Search bar displays
- [ ] Filter chips render (All, Movies, TV)
- [ ] Content grid shows 2 columns
- [ ] Cards sized correctly
- [ ] Scrolling smooth

#### Search Functionality
- [ ] Search bar accepts input
- [ ] Debouncing works (300ms delay)
- [ ] Search icon visible
- [ ] Clear button appears with text
- [ ] Clear button removes text and results
- [ ] Results update after typing stops
- [ ] Empty search shows browse content
- [ ] Loading indicator during search
- [ ] Keyboard dismisses on scroll

#### Search Results
- [ ] Results display in 2-column grid
- [ ] Poster images load
- [ ] Platform badges show
- [ ] No results shows empty state:
  - [ ] Icon displays
  - [ ] "No results found" message
  - [ ] Helpful subtitle
- [ ] Search filters work (All/Movies/TV)
- [ ] Multiple searches work sequentially

#### Pagination
- [ ] Scroll to bottom loads more content
- [ ] Loading indicator in footer
- [ ] New content appends to list
- [ ] No duplicate items
- [ ] Pagination stops when no more results

#### Performance
- [ ] Debouncing reduces API calls
- [ ] Smooth scrolling with 60 FPS
- [ ] Images load progressively
- [ ] Memory stable during search

### 2.3 DetailScreen

#### Layout & UI
- [ ] Backdrop image loads
- [ ] Gradient overlay renders
- [ ] Glass back button visible and functional
- [ ] Poster image loads (w500)
- [ ] Title displays
- [ ] Metadata row shows:
  - [ ] Year
  - [ ] Runtime (movies) or episode length (TV)
  - [ ] Content rating (18+ or PG)
- [ ] Rating badges display:
  - [ ] Rotten Tomatoes (if available)
  - [ ] IMDb (if available)
- [ ] Synopsis text readable
- [ ] "Available on:" section shows
- [ ] Platform chips display
- [ ] Cast section shows:
  - [ ] Cast photos (or placeholder)
  - [ ] Actor names
  - [ ] Character names
  - [ ] Horizontal scroll works

#### Data Loading
- [ ] Loading indicator shows initially
- [ ] TMDb data loads successfully
- [ ] OMDB ratings fetch (if IMDb ID available)
- [ ] External IDs fetched
- [ ] Watch providers for GB region
- [ ] Credits/cast data loaded
- [ ] All data displays correctly

#### Error Handling
- [ ] Invalid ID shows error
- [ ] Missing IMDb ID handled gracefully
- [ ] No ratings shows without badges
- [ ] No platforms shows without section
- [ ] No cast shows without section
- [ ] Back button always works

#### Performance
- [ ] Screen loads < 1 second
- [ ] Images load progressively
- [ ] Smooth scrolling
- [ ] No memory leaks

### 2.4 WatchlistScreen

#### Layout & UI
- [ ] Header "My Watchlist" displays
- [ ] Tab selector shows "Want to Watch" and "Watched"
- [ ] Grid/list view toggle works
- [ ] Item count displays correctly
- [ ] Cards render in correct variant (grid/list)

#### Tab Filtering
- [ ] "Want to Watch" tab shows correct items
- [ ] "Watched" tab shows correct items
- [ ] Tab counts update correctly
- [ ] Switching tabs updates list

#### Item Management
- [ ] Long press shows remove option
- [ ] Remove updates list immediately
- [ ] Removed items don't reappear
- [ ] Status badge shows correct state

#### Empty States
- [ ] Empty watchlist shows:
  - [ ] Icon displays
  - [ ] "Your watchlist is empty" message
  - [ ] "Browse Content" action button
- [ ] Empty tab shows appropriate message

#### Performance
- [ ] Smooth scrolling in grid mode
- [ ] Smooth scrolling in list mode
- [ ] Memory stable with 50+ items

### 2.5 Watchlist Button (DetailScreen)

#### States
- [ ] Not in watchlist: Outline bookmark icon
- [ ] Want to Watch: Filled bookmark with checkmark
- [ ] Watched: Checkmark with rating display

#### Interactions
- [ ] Tap adds to watchlist (not in list)
- [ ] Tap opens status picker (in list)
- [ ] Status change reflects immediately
- [ ] Rating selection works (thumbs up/down/neutral)
- [ ] "Remove from Watchlist" works

#### Feedback
- [ ] Toast shows on add
- [ ] Toast shows on status change
- [ ] Toast shows on remove

### 2.6 Recommendations (HomeScreen)

#### "For You" Section
- [ ] Section appears when watchlist has items
- [ ] Section hidden with empty watchlist
- [ ] Recommendations display correctly
- [ ] Horizontal scrolling works
- [ ] Cards show "reason" text

#### Recommendation Quality
- [ ] Recommendations reflect genre preferences
- [ ] "Because you like [genre]" shows
- [ ] "Similar to [title]" shows for similar content
- [ ] No duplicate recommendations

#### Interactions
- [ ] Dismiss (X) button works
- [ ] Dismissed items don't reappear
- [ ] Quick add to watchlist works
- [ ] Card tap navigates to detail

#### Cache Behavior
- [ ] Recommendations cache (6 hours)
- [ ] Pull-to-refresh regenerates
- [ ] Cache invalidates on watchlist change
- [ ] Diversity: max 3 per genre in top 10

---

## 3. Edge Case Testing

### 3.1 Network Conditions

#### No Internet Connection
- [ ] App launches in offline mode
- [ ] Cached content displays
- [ ] Network error message shows for fresh requests
- [ ] Retry button appears
- [ ] Retry works when connection restored
- [ ] Error messages user-friendly

#### Slow Network
- [ ] Loading indicators show
- [ ] Timeout after 10 seconds
- [ ] Error handled gracefully
- [ ] Cached data used when available

#### Intermittent Connection
- [ ] Requests retry automatically
- [ ] User not blocked
- [ ] App remains responsive

### 3.2 Empty States

#### No Platforms Selected
- [ ] HomeScreen shows empty state:
  - [ ] Icon displays
  - [ ] "No Platforms Selected" message
  - [ ] Helpful instructions
- [ ] No API calls made
- [ ] Can navigate to profile to select platforms

#### Empty Search Results
- [ ] "No results found" message
- [ ] Clear search suggestion
- [ ] Try different term suggestion
- [ ] Empty state icon displays

#### No Content Available
- [ ] Empty state shows
- [ ] Helpful message displays
- [ ] No crash or blank screen

#### Watchlist Empty States
- [ ] Empty watchlist shows CTA to browse
- [ ] Empty "Want to Watch" tab handled
- [ ] Empty "Watched" tab handled
- [ ] Recommendations hidden with empty watchlist

#### Recommendations Empty States
- [ ] No recommendations with empty watchlist
- [ ] All recommendations dismissed handled
- [ ] Cache expiry handled gracefully

### 3.3 API Error Scenarios

#### Invalid API Key
- [ ] Authentication error caught
- [ ] User-friendly error message
- [ ] App doesn't crash
- [ ] Error logged

#### Rate Limiting (429)
- [ ] Rate limit message shows
- [ ] "Too many requests" error
- [ ] Requests throttled
- [ ] User can wait and retry

#### Server Error (500)
- [ ] Service error message
- [ ] Retry option available
- [ ] App remains stable

#### Invalid Response
- [ ] Malformed JSON handled
- [ ] Default/empty data used
- [ ] No crash
- [ ] Error logged

### 3.4 User Input Edge Cases

#### Search Input
- [ ] Empty search (returns to browse)
- [ ] Special characters (%, $, &)
- [ ] Very long search query (100+ chars)
- [ ] Numbers only
- [ ] Emoji characters
- [ ] Rapid typing (debouncing works)

#### Form Validation
- [ ] Name with 1 character (error)
- [ ] Name with 100 characters (accepted)
- [ ] Email without @ (error)
- [ ] Email with multiple @ (error)
- [ ] Valid email formats accepted
- [ ] Copy/paste into fields

### 3.5 Rapid Interactions

#### Fast Navigation
- [ ] Tap multiple screens rapidly
- [ ] No double navigation
- [ ] No crash
- [ ] Back button works correctly

#### Rapid Scrolling
- [ ] Fast scroll up/down
- [ ] Images still load
- [ ] No blank cards
- [ ] No crash

#### Rapid Filter Changes
- [ ] Quick filter switching
- [ ] Previous requests cancelled
- [ ] Current filter loads correctly
- [ ] No stale data displayed

### 3.6 Background/Foreground Transitions

#### App Backgrounding
- [ ] Press home button
- [ ] App pauses correctly
- [ ] No crash
- [ ] Memory released appropriately

#### App Foregrounding
- [ ] Return from background
- [ ] App resumes correctly
- [ ] Data still displayed
- [ ] Can continue using immediately
- [ ] Cache still valid
- [ ] No re-authentication needed

#### Long Background (> 5 minutes)
- [ ] App restores state
- [ ] Cached data still available
- [ ] Fresh data fetched if cache expired
- [ ] User not logged out

#### Memory Warnings
- [ ] App handles memory warning
- [ ] Cache cleared automatically
- [ ] App doesn't crash
- [ ] User experience continues

---

## 4. Platform-Specific Testing

### 4.1 Android Testing

#### UI Elements
- [ ] Status bar color correct
- [ ] Navigation bar color correct
- [ ] Safe area insets respected
- [ ] Glass effects render (semi-transparent fallback)
- [ ] Ripple effects on buttons
- [ ] Material Design guidelines followed

#### Performance
- [ ] App size < 50MB
- [ ] Startup time < 2 seconds
- [ ] 60 FPS scrolling on mid-range device
- [ ] Memory usage < 150MB

#### Screen Sizes
- [ ] Small phone (5" - 1080x1920)
  - [ ] 2-column grid works
  - [ ] Text readable
  - [ ] Buttons accessible
- [ ] Large phone (6.5" - 1440x3040)
  - [ ] Content scales appropriately
  - [ ] No wasted space
- [ ] Tablet (10" - 1920x1200)
  - [ ] Layout adapts
  - [ ] Images high quality
  - [ ] Touch targets appropriate

#### Android-Specific
- [ ] Back button navigation works
- [ ] System back gesture works
- [ ] Share functionality works
- [ ] Notifications work (if implemented)
- [ ] Deep links work (if implemented)

### 4.2 iOS Testing

#### UI Elements
- [ ] Status bar style correct
- [ ] Safe area insets (notch) respected
- [ ] Glass effects render (BlurView)
- [ ] Native blur intensity correct
- [ ] Swipe gestures work
- [ ] Haptic feedback (if implemented)

#### Performance
- [ ] App size < 50MB
- [ ] Startup time < 2 seconds
- [ ] 60 FPS scrolling
- [ ] Memory usage < 150MB

#### Screen Sizes
- [ ] iPhone SE (4.7")
  - [ ] Content visible
  - [ ] No overflow
  - [ ] Touch targets adequate
- [ ] iPhone 14 (6.1")
  - [ ] Standard layout works
  - [ ] Images load correctly
- [ ] iPhone 14 Pro Max (6.7")
  - [ ] Dynamic Island works
  - [ ] Content scales well

#### iOS-Specific
- [ ] Swipe back gesture works
- [ ] 3D Touch/Haptic Touch (if implemented)
- [ ] Share sheet works
- [ ] App icon displays correctly
- [ ] Launch screen displays

### 4.3 Cross-Platform Consistency

#### UI Consistency
- [ ] Colors match on both platforms
- [ ] Typography consistent
- [ ] Spacing identical
- [ ] Glass effects similar appearance
- [ ] Animations same speed

#### Functionality
- [ ] All features work on both platforms
- [ ] Same data displayed
- [ ] Same error handling
- [ ] Same navigation patterns

---

## 5. Performance Testing

### 5.1 Load Times
- [ ] App launch: < 2 seconds
- [ ] Screen navigation: < 300ms
- [ ] Image load (perceived): < 500ms
- [ ] API response (fresh): < 1s
- [ ] API response (cached): < 100ms

### 5.2 Memory Usage
- [ ] Initial launch: < 80MB
- [ ] After 5 min browsing: < 150MB
- [ ] After 10 searches: < 150MB
- [ ] Cache size: < 50MB
- [ ] Image cache: < 30MB

### 5.3 Battery Usage
- [ ] Idle (screen off): < 1% per hour
- [ ] Active browsing: < 5% per hour
- [ ] Location tracking: N/A
- [ ] Background refresh: < 1% per hour

### 5.4 Network Usage
- [ ] Initial load: < 5MB
- [ ] 10 searches: < 10MB
- [ ] 30 min browsing: < 20MB
- [ ] Cache effectiveness: > 70% hit rate

### 5.5 Frame Rate
- [ ] Scrolling: 60 FPS
- [ ] Animations: 60 FPS
- [ ] Image loading: No jank
- [ ] Filter changes: Smooth

---

## 6. Accessibility Testing

### 6.1 Text Sizing
- [ ] App works with large text (accessibility settings)
- [ ] No text overflow
- [ ] Buttons remain tappable
- [ ] Content readable at 150% scale

### 6.2 Screen Reader
- [ ] VoiceOver (iOS) reads content
- [ ] TalkBack (Android) reads content
- [ ] Images have alt text
- [ ] Buttons have labels
- [ ] Navigation announces correctly

### 6.3 Color Contrast
- [ ] Text meets WCAG AA standards
- [ ] Buttons visible
- [ ] Glass effects readable
- [ ] Dark theme sufficient contrast

### 6.4 Touch Targets
- [ ] All buttons > 44x44 points
- [ ] Cards easy to tap
- [ ] No accidental taps
- [ ] Adequate spacing

---

## 7. Security Testing

### 7.1 API Keys
- [ ] API keys not exposed in code
- [ ] Keys loaded from environment
- [ ] No keys in logs
- [ ] No keys in error messages

### 7.2 Data Storage
- [ ] Sensitive data encrypted (if any)
- [ ] AsyncStorage secure
- [ ] No PII logged
- [ ] User data removable

### 7.3 Network Security
- [ ] HTTPS enforced
- [ ] Certificate pinning (if implemented)
- [ ] No insecure requests
- [ ] Timeout configured

---

## 8. Regression Testing

### 8.1 After Updates
- [ ] All onboarding steps work
- [ ] HomeScreen loads correctly
- [ ] "For You" recommendations show
- [ ] Search functionality works
- [ ] DetailScreen displays data
- [ ] Watchlist button states correct
- [ ] WatchlistScreen loads correctly
- [ ] Filtering works
- [ ] Platform selection works
- [ ] Images load
- [ ] Cache works (API + recommendations)
- [ ] Error handling intact

### 8.2 After Dependencies Update
- [ ] App builds successfully
- [ ] No breaking changes
- [ ] All features functional
- [ ] Performance not degraded
- [ ] No new crashes

---

## Test Results Template

### Test Session Information
**Date:** _________________
**Tester:** _________________
**Device:** _________________
**OS Version:** _________________
**App Version:** _________________
**Network:** _________________

### Issues Found

#### Critical Issues (App Crashes/Data Loss)
1.
2.

#### Major Issues (Feature Broken)
1.
2.

#### Minor Issues (UI/UX Problems)
1.
2.

#### Enhancements (Nice to Have)
1.
2.

### Overall Assessment
- [ ] Pass - Ready for release
- [ ] Pass with Minor Issues - Can release with notes
- [ ] Fail - Critical issues need fixing
- [ ] Needs More Testing

### Notes
_______________________________________
_______________________________________
_______________________________________

---

## Automated Testing Recommendations

### Unit Tests
```javascript
// API tests
describe('TMDb API', () => {
  test('discoverMovies returns results', async () => {
    const response = await discoverMovies({ watch_region: 'GB' });
    expect(response.success).toBe(true);
    expect(response.data.results).toBeDefined();
  });
});

// Cache tests
describe('Cache', () => {
  test('setCachedData and getCachedData work', async () => {
    await setCachedData('test-key', { foo: 'bar' });
    const cached = await getCachedData('test-key');
    expect(cached).toEqual({ foo: 'bar' });
  });
});

// Error handler tests
describe('Error Handler', () => {
  test('classifyError identifies network errors', () => {
    const error = new Error('Network request failed');
    const type = classifyError(error);
    expect(type).toBe(ErrorType.NETWORK);
  });
});

// Watchlist tests
describe('Watchlist Storage', () => {
  test('addToWatchlist stores item correctly', async () => {
    const result = await addToWatchlist(123, 'movie', { title: 'Test' });
    expect(result.success).toBe(true);
  });

  test('getWatchlist returns stored items', async () => {
    const watchlist = await getWatchlist();
    expect(watchlist.items).toBeDefined();
    expect(Array.isArray(watchlist.items)).toBe(true);
  });

  test('setWatchlistStatus updates item', async () => {
    await setWatchlistStatus(123, 'movie', 'watched');
    const item = await getWatchlistItem(123, 'movie');
    expect(item.status).toBe('watched');
  });
});

// Recommendation engine tests
describe('Recommendation Engine', () => {
  test('calculateGenreAffinities returns scores', async () => {
    const affinities = await calculateGenreAffinities();
    expect(typeof affinities).toBe('object');
  });

  test('getTopGenres returns sorted genres', () => {
    const affinities = { 28: 5, 35: 3, 18: 7 };
    const top = getTopGenres(affinities, 2);
    expect(top[0].genreId).toBe(18); // Highest score first
  });

  test('generateRecommendations returns results', async () => {
    const recs = await generateRecommendations([], 'GB');
    expect(Array.isArray(recs)).toBe(true);
  });
});
```

### Integration Tests
```javascript
// Navigation tests
describe('Navigation', () => {
  test('complete onboarding flow', async () => {
    // Test WelcomeScreen → LocationScreen → PlatformsScreen → HomeScreen
  });
});

// Search tests
describe('Search', () => {
  test('search returns results', async () => {
    // Test search functionality end-to-end
  });
});

// Watchlist flow tests
describe('Watchlist Flow', () => {
  test('add → update status → rate → remove flow', async () => {
    // Test complete watchlist lifecycle
    await addToWatchlist(550, 'movie', { title: 'Fight Club' });
    await setWatchlistStatus(550, 'movie', 'watched');
    await setWatchlistRating(550, 'movie', 1);
    await removeFromWatchlist(550, 'movie');
  });
});

// Recommendations flow tests
describe('Recommendations Flow', () => {
  test('recommendations update after watchlist changes', async () => {
    // Add items, verify recs update
  });
});
```

### E2E Tests (Detox)
```javascript
describe('Full App Flow', () => {
  it('should complete onboarding and browse content', async () => {
    await element(by.id('name-input')).typeText('Test User');
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('continue-button')).tap();
    // ... continue testing flow
  });
});
```

---

## CI/CD Testing Pipeline

### Pre-Merge Checks
- [ ] Unit tests pass
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Build succeeds

### Post-Merge Checks
- [ ] Integration tests pass
- [ ] E2E tests pass (sample)
- [ ] Performance benchmarks meet targets
- [ ] Bundle size within limits

### Pre-Release Checks
- [ ] Full E2E test suite passes
- [ ] Manual testing complete
- [ ] Security scan passes
- [ ] All checklists completed
