/**
 * Tests for the theme manager functionality.
 */

import { themeManager } from '../utils/theme-manager.js';
import { THEME_PRESETS, DEFAULT_THEME } from '../config/theme-config.js';

describe('ThemeManager', () => {
  let root;
  let mockStorage;

  beforeEach(() => {
    // Mock document.documentElement
    root = document.createElement('div');
    root.style = {};
    Object.defineProperty(document, 'documentElement', {
      value: root,
      writable: true
    });

    // Mock localStorage
    mockStorage = {};
    global.localStorage = {
      getItem: jest.fn(key => mockStorage[key]),
      setItem: jest.fn((key, value) => { mockStorage[key] = value }),
      removeItem: jest.fn(key => delete mockStorage[key])
    };

    // Mock matchMedia
    global.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('should initialize with default theme when no stored preference', () => {
      const manager = new ThemeManager();
      expect(manager.currentTheme).toEqual(DEFAULT_THEME);
    });

    test('should initialize with stored theme when available', () => {
      mockStorage['user_theme_preference'] = JSON.stringify(THEME_PRESETS['intermediate']);
      const manager = new ThemeManager();
      expect(manager.currentTheme).toEqual(THEME_PRESETS['intermediate']);
    });
  });

  describe('theme validation', () => {
    test('should validate correct theme structure', () => {
      expect(themeManager.validateTheme(DEFAULT_THEME)).toBe(true);
    });

    test('should reject theme with missing properties', () => {
      const invalidTheme = { ...DEFAULT_THEME };
      delete invalidTheme.colors;
      expect(themeManager.validateTheme(invalidTheme)).toBe(false);
    });

    test('should reject invalid color values', () => {
      const invalidTheme = {
        ...DEFAULT_THEME,
        colors: {
          ...DEFAULT_THEME.colors,
          primary: 'invalid-color'
        }
      };
      expect(themeManager.validateTheme(invalidTheme)).toBe(false);
    });

    test('should reject invalid typography values', () => {
      const invalidTheme = {
        ...DEFAULT_THEME,
        typography: {
          ...DEFAULT_THEME.typography,
          headingScale: 0
        }
      };
      expect(themeManager.validateTheme(invalidTheme)).toBe(false);
    });
  });

  describe('theme application', () => {
    test('should apply theme CSS variables correctly', () => {
      themeManager.applyTheme(DEFAULT_THEME);
      
      // Check colors
      expect(root.style.getPropertyValue('--color-primary')).toBe(DEFAULT_THEME.colors.primary);
      expect(root.style.getPropertyValue('--color-secondary')).toBe(DEFAULT_THEME.colors.secondary);

      // Check typography
      expect(root.style.getPropertyValue('--font-family')).toBe(DEFAULT_THEME.typography.fontFamily);
      expect(root.style.getPropertyValue('--font-size-base')).toBe(DEFAULT_THEME.typography.baseFontSize);

      // Check spacing
      expect(root.style.getPropertyValue('--spacing-unit')).toBe(DEFAULT_THEME.spacing.unit);

      // Check animation
      expect(root.style.getPropertyValue('--animation-duration')).toBe(DEFAULT_THEME.animation.duration);
    });

    test('should store theme preference in localStorage', () => {
      themeManager.applyTheme(DEFAULT_THEME);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'user_theme_preference',
        JSON.stringify(DEFAULT_THEME)
      );
    });
  });

  describe('theme switching', () => {
    test('should switch to preset theme correctly', () => {
      themeManager.switchToPreset('intermediate');
      expect(themeManager.currentTheme).toEqual(THEME_PRESETS['intermediate']);
    });

    test('should handle invalid preset name', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      themeManager.switchToPreset('non-existent');
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('should toggle dark mode correctly', () => {
      themeManager.toggleDarkMode();
      expect(root.getAttribute('data-theme')).toBe('dark');
      themeManager.toggleDarkMode();
      expect(root.getAttribute('data-theme')).toBe('light');
    });

    test('should toggle high contrast mode correctly', () => {
      themeManager.toggleHighContrast();
      expect(root.getAttribute('data-theme')).toBe('high-contrast');
      themeManager.toggleHighContrast();
      expect(root.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('observer pattern', () => {
    test('should notify observers of theme changes', () => {
      const mockObserver = jest.fn();
      themeManager.subscribe(mockObserver);
      themeManager.applyTheme(DEFAULT_THEME);
      expect(mockObserver).toHaveBeenCalledWith(DEFAULT_THEME);
    });

    test('should handle observer unsubscription', () => {
      const mockObserver = jest.fn();
      themeManager.subscribe(mockObserver);
      themeManager.unsubscribe(mockObserver);
      themeManager.applyTheme(DEFAULT_THEME);
      expect(mockObserver).not.toHaveBeenCalled();
    });
  });
}); 