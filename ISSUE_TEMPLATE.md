# Issue Report Template

## Issue Information

**Issue ID:** #_____ (assign sequential number)
**Date Reported:** _____________
**Reported By:** _____________
**Priority:** [ ] P1-Critical [ ] P2-Major [ ] P3-Minor [ ] P4-Enhancement
**Status:** [ ] Open [ ] In Progress [ ] Fixed [ ] Closed [ ] Won't Fix

---

## Issue Summary

**Title:** _____________________________________________

**Category:**
- [ ] Crash/Freeze
- [ ] UI/Layout
- [ ] Functionality
- [ ] Performance
- [ ] Data/API
- [ ] Navigation
- [ ] Other: ___________

---

## Environment

**Device:** _________________ (e.g., iPhone 14, Galaxy S22)
**OS Version:** _________________ (e.g., iOS 16.2, Android 13)
**App Version:** _________________
**Network:** [ ] WiFi [ ] 4G/5G [ ] Offline
**Build Type:** [ ] Development [ ] Release

---

## Description

### What Happened (Actual Behavior)
_______________________________________________________
_______________________________________________________
_______________________________________________________

### What Should Happen (Expected Behavior)
_______________________________________________________
_______________________________________________________
_______________________________________________________

### Impact
- [ ] Blocker - App unusable
- [ ] High - Major feature broken
- [ ] Medium - Feature partially works
- [ ] Low - Minor inconvenience
- [ ] None - Cosmetic only

---

## Steps to Reproduce

1. _______________________________________________________
2. _______________________________________________________
3. _______________________________________________________
4. _______________________________________________________
5. _______________________________________________________

**Frequency:**
- [ ] Always (100%)
- [ ] Often (75%)
- [ ] Sometimes (50%)
- [ ] Rarely (25%)
- [ ] Once

---

## Screenshots/Videos

**Screenshot 1:** (attach or link)
_______________________________________________________

**Screenshot 2:** (attach or link)
_______________________________________________________

**Video:** (attach or link)
_______________________________________________________

---

## Console Logs

```
[Paste relevant console output here]




```

---

## Additional Context

### Related Issues
- Issue #_____
- Issue #_____

### Workaround (if any)
_______________________________________________________
_______________________________________________________

### Notes
_______________________________________________________
_______________________________________________________

---

## For Developer Use

### Root Cause
_______________________________________________________
_______________________________________________________

### Files Affected
- [ ] src/screens/_______________.js
- [ ] src/components/_______________.js
- [ ] src/api/_______________.js
- [ ] src/utils/_______________.js
- [ ] Other: _______________

### Fix Description
_______________________________________________________
_______________________________________________________

### Test Results After Fix
- [ ] Issue resolved
- [ ] No regression
- [ ] Tested on multiple devices
- [ ] Ready for release

**Fixed By:** _________________
**Date Fixed:** _________________
**Commit:** _________________

---

# Example Issues

## Example 1: Critical Bug

**Issue ID:** #001
**Date Reported:** 2024-01-15
**Reported By:** John Doe
**Priority:** [X] P1-Critical [ ] P2-Major [ ] P3-Minor [ ] P4-Enhancement
**Status:** [X] Open [ ] In Progress [ ] Fixed [ ] Closed [ ] Won't Fix

### Issue Summary
**Title:** App crashes when searching with no internet connection

**Category:** [X] Crash/Freeze

### Environment
**Device:** iPhone 14
**OS Version:** iOS 16.2
**App Version:** 1.0.0
**Network:** [X] Offline

### Description

**What Happened:**
When I search for "Batman" with no internet connection, the app crashes immediately after typing the query and waiting 500ms.

**What Should Happen:**
The app should display a network error message with a retry button, similar to other screens.

**Impact:**
[X] Blocker - App unusable

### Steps to Reproduce
1. Turn off WiFi and mobile data
2. Open StreamFinder app
3. Navigate to Browse screen
4. Tap search bar
5. Type "Batman"
6. Wait 500ms
7. App crashes

**Frequency:** [X] Always (100%)

### Console Logs
```
[TMDb API] Network error: Cannot connect to server
[SearchScreen] Unhandled error: undefined is not an object
Error: Cannot read property 'data' of undefined
  at SearchScreen.searchContent (SearchScreen.js:145)
```

### Root Cause
Missing null check for network response in searchContent function. When offline, the response is undefined but code attempts to access response.data.

### Files Affected
- [X] src/screens/BrowseScreen.js

### Fix Description
Added null/undefined check before accessing response data. Added proper error handling with ErrorMessage component display.

---

## Example 2: UI Issue

**Issue ID:** #002
**Date Reported:** 2024-01-15
**Reported By:** Jane Smith
**Priority:** [ ] P1-Critical [X] P2-Major [ ] P3-Minor [ ] P4-Enhancement
**Status:** [ ] Open [X] In Progress [ ] Fixed [ ] Closed [ ] Won't Fix

### Issue Summary
**Title:** Platform badges overlap on small screens

**Category:** [X] UI/Layout

### Environment
**Device:** iPhone SE (2nd gen)
**OS Version:** iOS 15.7
**App Version:** 1.0.0
**Network:** [X] WiFi

### Description

**What Happened:**
On iPhone SE's small screen (4.7"), when a content card has 4+ platforms, the platform badges overlap with the title text at the bottom of the card.

**What Should Happen:**
Badges should stack or wrap to a second row, or the title overlay should start higher to avoid overlap.

**Impact:**
[X] Medium - Feature partially works

### Steps to Reproduce
1. Open app on iPhone SE
2. Select 4+ streaming platforms
3. Navigate to Home or Browse screen
4. Find content card with 4+ platform badges
5. Observe overlap with title

**Frequency:** [X] Often (75%)

### Screenshots
[Screenshot showing badge overlap]

### Fix Description
Adjusted badge positioning and title overlay padding for small screens. Added media query for devices < 5" to use compact badge layout.

---

## Example 3: Performance Issue

**Issue ID:** #003
**Date Reported:** 2024-01-16
**Reported By:** Testing Team
**Priority:** [ ] P1-Critical [X] P2-Major [ ] P3-Minor [ ] P4-Enhancement
**Status:** [X] Fixed

### Issue Summary
**Title:** Scroll lag when loading many images

**Category:** [X] Performance

### Environment
**Device:** Galaxy A52 (mid-range Android)
**OS Version:** Android 12
**App Version:** 1.0.0

### Description

**What Happened:**
When scrolling through Browse screen with 50+ items, the app experiences significant frame drops (15-20 FPS) and stuttering.

**What Should Happen:**
Scrolling should maintain 60 FPS even with many items loaded.

**Impact:**
[X] Medium - Feature partially works

### Steps to Reproduce
1. Open app
2. Navigate to Browse screen
3. Scroll down to load 50+ content items
4. Scroll up and down rapidly
5. Observe frame rate drops

**Frequency:** [X] Always (100%)

### Root Cause
- FlatList not using `getItemLayout` optimization
- Images loading synchronously
- No component memoization

### Fix Description
1. Implemented `getItemLayout` for FlatList
2. Added React.memo to ContentCard component
3. Enabled `removeClippedSubviews={true}`
4. Set `initialNumToRender={6}` and `maxToRenderPerBatch={4}`

### Test Results After Fix
- [X] Issue resolved
- [X] No regression
- [X] Tested on multiple devices
- [X] Ready for release

**Fixed By:** Developer
**Date Fixed:** 2024-01-17
**Commit:** abc123def

---

## Example 4: Enhancement Request

**Issue ID:** #004
**Date Reported:** 2024-01-16
**Reported By:** User Feedback
**Priority:** [ ] P1-Critical [ ] P2-Major [ ] P3-Minor [X] P4-Enhancement
**Status:** [ ] Open [ ] In Progress [ ] Fixed [ ] Closed [X] Won't Fix (Future Release)

### Issue Summary
**Title:** Add ability to mark content as "watched"

**Category:** [X] Other: Feature Request

### Description

**What Happened:**
Users want to track which movies/shows they've watched.

**What Should Happen:**
Add a "watched" button on DetailScreen to mark content as watched. Show watched indicator on cards.

**Impact:**
[ ] None - Enhancement

### Notes
Good feature request but out of scope for v1.0. Consider for v1.1 release. Would require:
- Local storage for watched list
- UI changes to DetailScreen
- Visual indicator on content cards
- Potential sync across devices

**Status:** Won't Fix (postponed to v1.1)

---

# Issue Tracking Log

| ID | Priority | Title | Status | Assigned To | Date |
|----|----------|-------|--------|-------------|------|
| 001 | P1 | App crashes when searching offline | Fixed | John | 1/17 |
| 002 | P2 | Platform badges overlap on small screens | In Progress | Jane | 1/15 |
| 003 | P2 | Scroll lag with many images | Fixed | Dev Team | 1/17 |
| 004 | P4 | Add "watched" tracking | Won't Fix | - | 1/16 |
| 005 | | | | | |
| 006 | | | | | |
| 007 | | | | | |
| 008 | | | | | |
| 009 | | | | | |
| 010 | | | | | |

---

# Priority Definitions

**P1 - Critical:**
- App crashes or data loss
- Major security vulnerability
- Core feature completely broken
- Must fix before ANY release

**P2 - Major:**
- Important feature broken or significantly impaired
- Poor user experience
- Affects multiple users
- Must fix before production release

**P3 - Minor:**
- Small UI issues
- Inconsistencies
- Edge case bugs
- Should fix if time permits

**P4 - Enhancement:**
- Nice-to-have features
- Improvements
- Suggestions
- Consider for future releases

---

# Status Definitions

**Open:** Issue reported and confirmed, not yet assigned

**In Progress:** Developer actively working on fix

**Fixed:** Issue resolved, pending testing

**Closed:** Issue fixed and verified, released

**Won't Fix:** Issue acknowledged but won't be addressed (explain why)
