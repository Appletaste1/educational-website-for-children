/**
 * Tests for the footer component functionality.
 * Verifies theme integration, accessibility, and responsive behavior.
 */

import { themeManager } from '../utils/theme-manager.js';
import { THEME_PRESETS } from '../config/theme-config.js';

describe('Footer Component', () => {
  let footer;

  beforeEach(() => {
    document.body.innerHTML = `
      <footer class="theme-transition">
        <div class="footer-grid">
          <div class="footer-section">
            <h3>学习资源</h3>
            <a class="theme-transition theme-interactive footer-link" href="courses.html">课程介绍</a>
            <a class="theme-transition theme-interactive footer-link" href="resources.html">学习资料</a>
          </div>
          <div class="footer-section">
            <h3>关于我们</h3>
            <a class="theme-transition theme-interactive footer-link" href="about.html">团队介绍</a>
            <a class="theme-transition theme-interactive footer-link" href="contact.html">联系方式</a>
          </div>
          <div class="social-links">
            <a href="#" class="social-link" aria-label="微信">
              <i class="fab fa-weixin"></i>
            </a>
            <a href="#" class="social-link" aria-label="QQ">
              <i class="fab fa-qq"></i>
            </a>
          </div>
          <div class="legal-links">
            <a href="privacy.html">隐私政策</a>
            <a href="terms.html">使用条款</a>
          </div>
        </div>
      </footer>
    `;
    footer = document.querySelector('footer');
    
    // Initialize theme manager with test presets
    themeManager.init({
      initial: 'default',
      presets: {
        default: {
          colors: {
            primary: '#ffffff',
            secondary: '#000000',
            accent: '#0066cc'
          }
        },
        dark: {
          colors: {
            primary: '#1a1a1a',
            secondary: '#ffffff',
            accent: '#3399ff'
          }
        }
      }
    });
  });

  describe('Theme Integration', () => {
    test('should apply theme transitions class', () => {
      expect(footer.classList.contains('theme-transition')).toBe(true);
    });

    test('should update colors when theme changes', () => {
      const initialColor = window.getComputedStyle(footer).backgroundColor;
      themeManager.switchToPreset('dark');
      const newColor = window.getComputedStyle(footer).backgroundColor;
      expect(newColor).not.toBe(initialColor);
    });

    test('should handle high contrast mode', () => {
      themeManager.enableHighContrast();
      const links = footer.querySelectorAll('.footer-link');
      links.forEach(link => {
        const contrast = getContrastRatio(
          window.getComputedStyle(link).color,
          window.getComputedStyle(link.parentElement).backgroundColor
        );
        expect(contrast).toBeGreaterThanOrEqual(4.5);
      });
    });

    test('should handle dark mode', () => {
      themeManager.switchToPreset('dark');
      const socialLinks = footer.querySelectorAll('.social-link');
      socialLinks.forEach(link => {
        const color = window.getComputedStyle(link).color;
        expect(color).toBe('rgb(255, 255, 255)'); // Using RGB value instead of theme preset
      });
    });
  });

  describe('Responsive Layout', () => {
    test('should adjust grid columns based on viewport width', () => {
      // Desktop view
      window.innerWidth = 1200;
      window.dispatchEvent(new Event('resize'));
      expect(window.getComputedStyle(footer.querySelector('.footer-grid')).gridTemplateColumns).toBe('repeat(4, 1fr)');

      // Tablet view
      window.innerWidth = 800;
      window.dispatchEvent(new Event('resize'));
      expect(window.getComputedStyle(footer.querySelector('.footer-grid')).gridTemplateColumns).toBe('repeat(2, 1fr)');
    });

    test('should stack legal links on mobile', () => {
      window.innerWidth = 480;
      window.dispatchEvent(new Event('resize'));
      const legalLinks = footer.querySelector('.legal-links');
      expect(window.getComputedStyle(legalLinks).display).toBe('flex');
      expect(window.getComputedStyle(legalLinks).flexDirection).toBe('column');
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels on social links', () => {
      const socialLinks = footer.querySelectorAll('.social-link');
      socialLinks.forEach(link => {
        expect(link.hasAttribute('aria-label')).toBe(true);
        expect(link.getAttribute('aria-label')).not.toBe('');
      });
    });

    test('should maintain sufficient color contrast', () => {
      const textElements = footer.querySelectorAll('a, h3');
      textElements.forEach(element => {
        const color = window.getComputedStyle(element).color || 'rgb(0, 0, 0)';
        const bgColor = window.getComputedStyle(element.parentElement).backgroundColor || 'rgb(255, 255, 255)';
        const contrast = getContrastRatio(color, bgColor);
        expect(contrast).toBeGreaterThanOrEqual(4.5);
      });
    });

    test('should be keyboard navigable', () => {
      const links = Array.from(footer.querySelectorAll('a'));
      const firstLink = links[0];
      const lastLink = links[links.length - 1];

      firstLink.focus();
      expect(document.activeElement).toBe(firstLink);

      // Tab through to last link
      links.forEach((_, index) => {
        if (index < links.length - 1) {
          simulateTabKey();
          expect(document.activeElement).toBe(links[index + 1]);
        }
      });
    });
  });

  describe('Content Organization', () => {
    test('should group related links together', () => {
      const sections = footer.querySelectorAll('.footer-section');
      sections.forEach(section => {
        const heading = section.querySelector('h3');
        const links = section.querySelectorAll('.footer-link');
        expect(heading).not.toBeNull();
        expect(links.length).toBeGreaterThan(0);
      });
    });

    test('should have valid social media links', () => {
      const socialLinks = footer.querySelectorAll('.social-link');
      expect(socialLinks.length).toBeGreaterThan(0);
      socialLinks.forEach(link => {
        expect(link.href).not.toBe('');
      });
    });

    test('should have valid contact information', () => {
      const contactLink = footer.querySelector('a[href="contact.html"]');
      expect(contactLink).not.toBeNull();
      expect(contactLink.textContent).toBe('联系方式');
    });
  });
});

// Helper function to calculate contrast ratio
function getContrastRatio(color1, color2) {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Helper function to calculate relative luminance
function getLuminance(color) {
  const rgb = color.match(/\d+/g);
  if (!rgb) return 0;
  
  const [r, g, b] = rgb.map(Number).map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Helper function to simulate tab key press
function simulateTabKey() {
  const event = new KeyboardEvent('keydown', {
    key: 'Tab',
    code: 'Tab',
    bubbles: true,
    cancelable: true
  });
  document.activeElement.dispatchEvent(event);
} 
