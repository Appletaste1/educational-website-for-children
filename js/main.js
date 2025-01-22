// Import styles
import '../css/components/footer.css';
// Import other CSS files as needed

// Import components
import { footer } from './components/footer.js';
// Import other components as needed

// Initialize theme manager
import { themeManager } from './utils/theme-manager.js';
themeManager.init({
  initial: 'default',
  presets: {
    default: {
      colors: {
        primary: '#ffffff',
        secondary: '#000000',
        accent: '#0066cc',
        background: '#ffffff',
        text: '#000000',
        'text-secondary': '#666666',
        heading: '#333333'
      }
    },
    dark: {
      colors: {
        primary: '#1a1a1a',
        secondary: '#ffffff',
        accent: '#3399ff',
        background: '#1a1a1a',
        text: '#ffffff',
        'text-secondary': '#cccccc',
        heading: '#ffffff'
      }
    }
  }
});

// Initialize components
document.addEventListener('DOMContentLoaded', () => {
  // Initialize footer
  footer.init();

  // Add theme toggle functionality
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = themeManager.getCurrentPreset();
      themeManager.switchToPreset(currentTheme === 'dark' ? 'default' : 'dark');
    });
  }

  // Add high contrast toggle functionality
  const contrastToggle = document.getElementById('contrast-toggle');
  if (contrastToggle) {
    contrastToggle.addEventListener('click', () => {
      const isHighContrast = document.body.classList.contains('high-contrast');
      if (isHighContrast) {
        themeManager.disableHighContrast();
      } else {
        themeManager.enableHighContrast();
      }
    });
  }

  // Initialize other components and functionality
  setupResponsiveNavigation();
  setupAccessibilityFeatures();
  setupAnalytics();
});

// Responsive navigation setup
function setupResponsiveNavigation() {
  const menuButton = document.getElementById('menu-toggle');
  const nav = document.querySelector('nav');

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      nav.classList.toggle('active');
      menuButton.setAttribute(
        'aria-expanded',
        nav.classList.contains('active').toString()
      );
    });
  }
}

// Accessibility features setup
function setupAccessibilityFeatures() {
  // Add skip to main content link
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-link';
  skipLink.textContent = '跳转到主要内容';
  document.body.insertBefore(skipLink, document.body.firstChild);

  // Add aria-current to current page link
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

// Analytics setup
function setupAnalytics() {
  // Initialize analytics if needed
  if (process.env.NODE_ENV === 'production') {
    // Add your analytics code here
    console.log('Analytics initialized in production mode');
  }
} 