/**
 * Error Handler Utilities
 * Centralized error handling and logging
 */

/**
 * Error types for categorization
 */
export const ErrorType = {
  NETWORK: 'NETWORK',
  API: 'API',
  CACHE: 'CACHE',
  RATE_LIMIT: 'RATE_LIMIT',
  AUTHENTICATION: 'AUTHENTICATION',
  VALIDATION: 'VALIDATION',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Classify error based on error object
 */
export const classifyError = (error) => {
  if (!error) return ErrorType.UNKNOWN;

  // Network errors
  if (error.message?.includes('Network request failed') || error.code === 'NETWORK_ERROR') {
    return ErrorType.NETWORK;
  }

  // Rate limiting
  if (error.status === 429 || error.code === 'RATE_LIMIT') {
    return ErrorType.RATE_LIMIT;
  }

  // Authentication errors
  if (error.status === 401 || error.status === 403) {
    return ErrorType.AUTHENTICATION;
  }

  // API errors
  if (error.status >= 400 && error.status < 500) {
    return ErrorType.API;
  }

  // Cache errors
  if (error.message?.includes('AsyncStorage') || error.code === 'CACHE_ERROR') {
    return ErrorType.CACHE;
  }

  return ErrorType.UNKNOWN;
};

/**
 * Get user-friendly error message
 */
export const getUserMessage = (error) => {
  const errorType = classifyError(error);

  switch (errorType) {
    case ErrorType.NETWORK:
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the internet. Please check your connection and try again.',
        action: 'Retry',
      };

    case ErrorType.RATE_LIMIT:
      return {
        title: 'Too Many Requests',
        message: 'You\'re making too many requests. Please wait a moment and try again.',
        action: 'OK',
      };

    case ErrorType.AUTHENTICATION:
      return {
        title: 'Authentication Error',
        message: 'There was a problem with authentication. Please restart the app.',
        action: 'OK',
      };

    case ErrorType.API:
      return {
        title: 'Service Error',
        message: 'The service is temporarily unavailable. Please try again later.',
        action: 'Retry',
      };

    case ErrorType.CACHE:
      return {
        title: 'Storage Error',
        message: 'There was a problem accessing local storage. Your experience may be affected.',
        action: 'OK',
      };

    default:
      return {
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred. Please try again.',
        action: 'Retry',
      };
  }
};

/**
 * Log error for debugging
 */
export const logError = (error, context = '') => {
  const errorType = classifyError(error);
  const timestamp = new Date().toISOString();

  console.error(`[${timestamp}] [${errorType}] ${context}:`, error);

  // In production, send to logging service
  if (!__DEV__) {
    // TODO: Send to logging service (e.g., Sentry, LogRocket)
    // sendToLoggingService({ error, errorType, context, timestamp });
  }
};

/**
 * Handle API errors with retry logic
 */
export const handleApiError = async (error, retryFn, maxRetries = 2) => {
  const errorType = classifyError(error);

  // Don't retry for certain error types
  if (errorType === ErrorType.AUTHENTICATION || errorType === ErrorType.VALIDATION) {
    throw error;
  }

  // Retry for network and rate limit errors
  if (errorType === ErrorType.NETWORK || errorType === ErrorType.RATE_LIMIT) {
    let retries = 0;

    while (retries < maxRetries) {
      try {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retries) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        return await retryFn();
      } catch (retryError) {
        retries++;
        if (retries >= maxRetries) {
          throw retryError;
        }
      }
    }
  }

  throw error;
};

/**
 * Handle cache errors gracefully
 */
export const handleCacheError = (error, defaultValue = null) => {
  logError(error, 'Cache operation failed');

  // Return default value on cache errors
  return defaultValue;
};

/**
 * Check if error is recoverable
 */
export const isRecoverableError = (error) => {
  const errorType = classifyError(error);

  return [
    ErrorType.NETWORK,
    ErrorType.RATE_LIMIT,
    ErrorType.API,
  ].includes(errorType);
};
