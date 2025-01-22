/**
 * Footer component implementation
 * Handles theme integration, accessibility, and responsive behavior
 */

import { themeManager } from '../utils/theme-manager.js';

export class Footer {
  constructor() {
    this.element = null;
    this.init();
  }

  init() {
    // Create footer element if it doesn't exist
    if (!this.element) {
      this.element = document.querySelector('footer') || this.createFooter();
    }

    // Initialize responsive behavior
    this.setupResponsiveLayout();

    // Initialize theme integration
    this.setupThemeIntegration();

    // Initialize accessibility features
    this.setupAccessibility();
  }

  createFooter() {
    const footer = document.createElement('footer');
    footer.classList.add('theme-transition');
    footer.innerHTML = `
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
    `;
    document.body.appendChild(footer);
    return footer;
  }

  setupResponsiveLayout() {
    const updateLayout = () => {
      const footerGrid = this.element.querySelector('.footer-grid');
      const legalLinks = this.element.querySelector('.legal-links');

      if (window.innerWidth >= 1200) {
        footerGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        legalLinks.style.flexDirection = 'row';
      } else if (window.innerWidth >= 800) {
        footerGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        legalLinks.style.flexDirection = 'row';
      } else {
        footerGrid.style.gridTemplateColumns = '1fr';
        legalLinks.style.flexDirection = 'column';
      }
    };

    window.addEventListener('resize', updateLayout);
    updateLayout(); // Initial layout
  }

  setupThemeIntegration() {
    // Apply theme transitions
    const themeElements = this.element.querySelectorAll('.theme-transition');
    themeElements.forEach(element => {
      element.style.transition = 'all 0.3s ease';
    });

    // Update social link colors for dark mode
    const updateSocialLinks = () => {
      const socialLinks = this.element.querySelectorAll('.social-link');
      const isDark = themeManager.getCurrentPreset() === 'dark';
      socialLinks.forEach(link => {
        link.style.color = isDark ? '#ffffff' : '#000000';
      });
    };

    themeManager.subscribe(updateSocialLinks);
    updateSocialLinks(); // Initial update
  }

  setupAccessibility() {
    // Ensure proper tab order
    const links = this.element.querySelectorAll('a');
    links.forEach(link => {
      link.setAttribute('tabindex', '0');
    });

    // Add keyboard navigation
    this.element.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        const focusableElements = this.element.querySelectorAll('a[tabindex="0"]');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    });
  }

  // Public methods for testing
  getElement() {
    return this.element;
  }

  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

// Export singleton instance
export const footer = new Footer(); 