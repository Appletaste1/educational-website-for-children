/**
 * Theme configuration and JSON schema for the educational website.
 * Defines core theme properties, age-specific presets, and validation rules.
 */

// Theme property schema for validation
export const THEME_SCHEMA = {
  type: 'object',
  required: ['name', 'colors', 'typography', 'spacing', 'animation', 'interactive'],
  properties: {
    name: { type: 'string' },
    colors: {
      type: 'object',
      required: ['primary', 'secondary', 'accent', 'background', 'text'],
      properties: {
        primary: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' },
        secondary: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' },
        accent: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' },
        background: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' },
        text: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' }
      }
    },
    typography: {
      type: 'object',
      required: ['fontFamily', 'baseFontSize', 'headingScale', 'lineHeight'],
      properties: {
        fontFamily: { type: 'string' },
        baseFontSize: { type: 'string', pattern: '^[0-9]+(px|rem|em)$' },
        headingScale: { type: 'number', minimum: 1 },
        lineHeight: { type: 'number', minimum: 1 }
      }
    },
    spacing: {
      type: 'object',
      required: ['unit', 'scale'],
      properties: {
        unit: { type: 'string', pattern: '^[0-9]+(px|rem|em)$' },
        scale: { type: 'number', minimum: 1 }
      }
    },
    animation: {
      type: 'object',
      required: ['duration', 'easing'],
      properties: {
        duration: { type: 'string', pattern: '^[0-9]+(ms|s)$' },
        easing: { type: 'string' }
      }
    },
    interactive: {
      type: 'object',
      required: ['hoverScale', 'activeOpacity', 'focusOutline'],
      properties: {
        hoverScale: { type: 'number', minimum: 1 },
        activeOpacity: { type: 'number', minimum: 0, maximum: 1 },
        focusOutline: { type: 'string' }
      }
    }
  }
};

// Age-specific theme presets
export const THEME_PRESETS = {
  'early-learner': {
    name: 'Early Learner',
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
      background: '#FFFFFF',
      text: '#2C3E50'
    },
    typography: {
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      baseFontSize: '18px',
      headingScale: 1.5,
      lineHeight: 1.6
    },
    spacing: {
      unit: '20px',
      scale: 1.5
    },
    animation: {
      duration: '300ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    interactive: {
      hoverScale: 1.1,
      activeOpacity: 0.8,
      focusOutline: '3px solid #4ECDC4'
    }
  },
  'intermediate': {
    name: 'Intermediate',
    colors: {
      primary: '#3498DB',
      secondary: '#2ECC71',
      accent: '#F1C40F',
      background: '#F8F9FA',
      text: '#2C3E50'
    },
    typography: {
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      baseFontSize: '16px',
      headingScale: 1.4,
      lineHeight: 1.5
    },
    spacing: {
      unit: '16px',
      scale: 1.4
    },
    animation: {
      duration: '250ms',
      easing: 'ease-in-out'
    },
    interactive: {
      hoverScale: 1.05,
      activeOpacity: 0.7,
      focusOutline: '2px solid #3498DB'
    }
  },
  'advanced': {
    name: 'Advanced',
    colors: {
      primary: '#9B59B6',
      secondary: '#E74C3C',
      accent: '#F39C12',
      background: '#ECF0F1',
      text: '#2C3E50'
    },
    typography: {
      fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif",
      baseFontSize: '14px',
      headingScale: 1.3,
      lineHeight: 1.4
    },
    spacing: {
      unit: '12px',
      scale: 1.3
    },
    animation: {
      duration: '200ms',
      easing: 'ease'
    },
    interactive: {
      hoverScale: 1.03,
      activeOpacity: 0.6,
      focusOutline: '2px solid #9B59B6'
    }
  }
};

// Default theme
export const DEFAULT_THEME = THEME_PRESETS['early-learner']; 