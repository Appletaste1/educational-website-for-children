/**
 * Theme Manager Utility
 * Handles theme switching, high contrast mode, and CSS variable management
 */

class ThemeManager {
  constructor() {
    this.currentPreset = 'default';
    this.presets = {};
    this.subscribers = new Set();
    this.isHighContrast = false;
  }

  init(config) {
    this.presets = config.presets || {};
    this.currentPreset = config.initial || 'default';
    
    // Apply initial theme
    this.applyTheme(this.currentPreset);
    
    // Load saved preferences
    this.loadPreferences();
    
    // Setup system theme detection
    this.setupSystemThemeDetection();
  }

  applyTheme(presetName) {
    const preset = this.presets[presetName];
    if (!preset) {
      console.error(`Theme preset "${presetName}" not found`);
      return;
    }

    // Apply CSS variables
    const root = document.documentElement;
    Object.entries(preset.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });

    // Update body classes
    document.body.classList.remove('theme-default', 'theme-dark');
    document.body.classList.add(`theme-${presetName}`);

    // Store current preset
    this.currentPreset = presetName;

    // Notify subscribers
    this.notifySubscribers();

    // Save preferences
    this.savePreferences();
  }

  switchToPreset(presetName) {
    if (this.presets[presetName]) {
      this.applyTheme(presetName);
    }
  }

  getCurrentPreset() {
    return this.currentPreset;
  }

  enableHighContrast() {
    document.body.classList.add('high-contrast');
    this.isHighContrast = true;
    this.savePreferences();
    this.notifySubscribers();
  }

  disableHighContrast() {
    document.body.classList.remove('high-contrast');
    this.isHighContrast = false;
    this.savePreferences();
    this.notifySubscribers();
  }

  subscribe(callback) {
    if (typeof callback === 'function') {
      this.subscribers.add(callback);
    }
  }

  unsubscribe(callback) {
    this.subscribers.delete(callback);
  }

  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback({
          currentPreset: this.currentPreset,
          isHighContrast: this.isHighContrast
        });
      } catch (error) {
        console.error('Error in theme subscriber:', error);
      }
    });
  }

  setupSystemThemeDetection() {
    // Check if system supports dark mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Initial check
    if (mediaQuery.matches) {
      this.switchToPreset('dark');
    }

    // Listen for changes
    mediaQuery.addEventListener('change', (e) => {
      this.switchToPreset(e.matches ? 'dark' : 'default');
    });
  }

  savePreferences() {
    try {
      const preferences = {
        theme: this.currentPreset,
        highContrast: this.isHighContrast
      };
      localStorage.setItem('themePreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving theme preferences:', error);
    }
  }

  loadPreferences() {
    try {
      const saved = localStorage.getItem('themePreferences');
      if (saved) {
        const preferences = JSON.parse(saved);
        if (preferences.theme) {
          this.switchToPreset(preferences.theme);
        }
        if (preferences.highContrast) {
          this.enableHighContrast();
        }
      }
    } catch (error) {
      console.error('Error loading theme preferences:', error);
    }
  }
}

// Export singleton instance
export const themeManager = new ThemeManager();