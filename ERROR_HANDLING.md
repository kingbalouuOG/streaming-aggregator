# Error Handling Documentation

## Overview

StreamFinder implements comprehensive error handling across all layers of the application to provide a robust and user-friendly experience.

## Components

### 1. ErrorBoundary Component
**Location:** `src/components/ErrorBoundary.js`

React Error Boundary that catches JavaScript errors anywhere in the component tree.

**Features:**
- Catches React rendering errors
- Displays fallback UI with friendly error message
- Shows detailed error info in development mode
- Provides "Try Again" button to reset error state
- Logs errors for debugging

**Usage:**
```jsx
import ErrorBoundary from './components/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 2. ErrorMessage Component
**Location:** `src/components/ErrorMessage.js`

Displays user-friendly error messages with optional retry functionality.

**Props:**
- `error` - Error object
- `onRetry` - Optional retry callback
- `style` - Optional style override

**Features:**
- Auto-classifies error type
- Shows appropriate user message
- Displays retry button for recoverable errors
- Glass morphism styling

**Usage:**
```jsx
<ErrorMessage
  error={error}
  onRetry={() => loadData()}
/>
```

### 3. EmptyState Component
**Location:** `src/components/EmptyState.js`

Displays helpful empty state messages.

**Props:**
- `icon` - Ionicon name (default: 'file-tray-outline')
- `title` - Main heading
- `message` - Description text
- `actionLabel` - Optional button label
- `onAction` - Optional button callback

**Usage:**
```jsx
<EmptyState
  icon="search-outline"
  title="No Results Found"
  message="Try a different search term"
  actionLabel="Clear Search"
  onAction={handleClear}
/>
```

## Error Handling Utilities

### Location: `src/utils/errorHandler.js`

### Error Types
```javascript
ErrorType = {
  NETWORK: 'NETWORK',           // Network connectivity issues
  API: 'API',                   // API server errors
  CACHE: 'CACHE',               // Storage/cache errors
  RATE_LIMIT: 'RATE_LIMIT',     // Too many requests
  AUTHENTICATION: 'AUTHENTICATION', // Auth failures
  VALIDATION: 'VALIDATION',     // Input validation errors
  UNKNOWN: 'UNKNOWN'            // Unclassified errors
}
```

### Key Functions

#### `classifyError(error)`
Categorizes errors based on error properties.

```javascript
const errorType = classifyError(error);
// Returns: ErrorType.NETWORK, ErrorType.API, etc.
```

#### `getUserMessage(error)`
Returns user-friendly error message object.

```javascript
const { title, message, action } = getUserMessage(error);
// title: "Connection Error"
// message: "Unable to connect..."
// action: "Retry"
```

#### `logError(error, context)`
Logs errors for debugging (console in dev, service in prod).

```javascript
logError(error, 'TMDb API');
```

#### `handleApiError(error, retryFn, maxRetries)`
Handles API errors with automatic retry logic.

```javascript
await handleApiError(error, () => fetchData(), 2);
```

#### `handleCacheError(error, defaultValue)`
Handles cache errors gracefully by returning default value.

```javascript
const data = handleCacheError(error, []);
```

#### `isRecoverableError(error)`
Checks if error can be retried.

```javascript
if (isRecoverableError(error)) {
  // Show retry button
}
```

## API Error Handling

### TMDb API
**Location:** `src/api/tmdb.js`

**Error Handling:**
- Network failures → Automatic classification as NETWORK error
- 401 errors → AUTHENTICATION error (invalid API key)
- 404 errors → API error (resource not found)
- 429 errors → RATE_LIMIT error (too many requests)
- 5xx errors → API error (server issues)

**Response Format:**
```javascript
{
  success: boolean,
  data: object | null,
  error: string | undefined
}
```

### OMDB API
**Location:** `src/api/omdb.js`

Similar error handling pattern as TMDb API.

## Cache Error Handling

**Location:** `src/api/cache.js`

### Features:
1. **Quota Exceeded Handling**
   - Automatically clears expired cache
   - Retries operation after cleanup
   - Logs quota errors

2. **Graceful Degradation**
   - Returns `null` on cache read errors
   - Continues without caching on write errors
   - Never blocks app functionality

3. **Error Recovery**
```javascript
// Auto-recovery from quota exceeded
try {
  await setCachedData(key, data);
} catch (error) {
  if (error.message.includes('QUOTA_EXCEEDED')) {
    await clearExpired(); // Clear old cache
    await setCachedData(key, data); // Retry
  }
}
```

## User Feedback Patterns

### 1. Loading States
```jsx
{isLoading && (
  <ActivityIndicator size="large" color={colors.accent.primary} />
)}
```

### 2. Error States
```jsx
{error && <ErrorMessage error={error} onRetry={handleRetry} />}
```

### 3. Empty States
```jsx
{data.length === 0 && (
  <EmptyState
    title="No Content Available"
    message="Select platforms in your profile"
  />
)}
```

### 4. Network Error with Retry
```jsx
<ErrorMessage
  error={networkError}
  onRetry={() => {
    setError(null);
    loadContent();
  }}
/>
```

## Best Practices

### 1. Always Wrap API Calls
```javascript
try {
  const response = await fetchData();
  if (!response.success) {
    setError(response.error);
  }
} catch (error) {
  logError(error, 'Data fetch');
  setError(error);
}
```

### 2. Provide Retry for Recoverable Errors
```javascript
if (isRecoverableError(error)) {
  return (
    <ErrorMessage
      error={error}
      onRetry={handleRetry}
    />
  );
}
```

### 3. Use Empty States for No Data
```javascript
if (!isLoading && data.length === 0) {
  return (
    <EmptyState
      title="No Results"
      message="Try adjusting your filters"
    />
  );
}
```

### 4. Log All Errors
```javascript
catch (error) {
  logError(error, 'HomeScreen content load');
  // Handle error
}
```

### 5. Handle Cache Errors Silently
```javascript
const cached = await getCachedData(key);
// Returns null on error, doesn't throw
```

## Error Flow Diagram

```
User Action
    ↓
API Call
    ↓
├─ Success → Update State → Render Data
│
├─ Network Error → classifyError() → getUserMessage() → Show Retry
│
├─ Rate Limit → classifyError() → Show Wait Message
│
├─ API Error → classifyError() → Show Error + Retry
│
└─ Unknown → classifyError() → Show Generic Error
```

## Testing Error Scenarios

### Network Error
```javascript
// Simulate by turning off wifi
// Should show: "Connection Error" with Retry button
```

### Rate Limit
```javascript
// Make many rapid requests
// Should show: "Too Many Requests" message
```

### Cache Quota
```javascript
// Fill AsyncStorage
// Should auto-clear expired and retry
```

### Empty State
```javascript
// Remove all platforms or clear search
// Should show helpful empty state
```

## Future Enhancements

1. **Error Reporting Service**
   - Integrate Sentry or similar service
   - Send production errors to logging service
   - Track error rates and patterns

2. **Offline Mode**
   - Detect offline state
   - Show offline banner
   - Queue actions for when online

3. **Toast Notifications**
   - Non-blocking error messages
   - Success confirmations
   - Progress indicators

4. **Error Analytics**
   - Track error frequency
   - Identify problematic endpoints
   - Monitor cache hit rates
