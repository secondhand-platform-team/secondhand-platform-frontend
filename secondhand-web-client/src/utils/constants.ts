/**
 * Constants
 * Application-wide constants
 */

export const APP_CONFIG = {
  APP_NAME: 'SecondHand',
  APP_VERSION: '1.0.0',
  API_TIMEOUT: 10000,
};

export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 30,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

export const MESSAGES = {
  SUCCESS: 'Operation successful',
  ERROR: 'An error occurred',
  LOADING: 'Loading...',
  NOT_FOUND: 'Resource not found',
};
