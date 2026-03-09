/**
 * Storage Service
 * Utilities for local storage operations
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
};

export const storageService = {
  /**
   * Get item from localStorage
   */
  getItem: <T = any>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage: ${key}`, error);
      return null;
    }
  },

  /**
   * Set item to localStorage
   */
  setItem: (key: string, value: any): void => {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error writing to localStorage: ${key}`, error);
    }
  },

  /**
   * Remove item from localStorage
   */
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage: ${key}`, error);
    }
  },

  /**
   * Clear all localStorage
   */
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage', error);
    }
  },

  /**
   * Auth specific methods
   */
  auth: {
    setTokens: (accessToken: string, refreshToken?: string) => {
      storageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      if (refreshToken) {
        storageService.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
    },

    getAccessToken: () => storageService.getItem<string>(STORAGE_KEYS.ACCESS_TOKEN),

    getRefreshToken: () => storageService.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN),

    clearAuth: () => {
      storageService.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      storageService.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      storageService.removeItem(STORAGE_KEYS.USER);
    },
  },
};

export default storageService;
