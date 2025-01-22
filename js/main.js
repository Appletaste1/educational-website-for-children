// Import styles
import '../css/components/footer.css';
// Import other CSS files as needed

// Import modules
import { authModule } from './auth-module.js';
import { themeManager } from './theme-manager.js';
import { soundManager } from './sound-manager.js';
import { footer } from './components/footer.js';

// Initialize modules
document.addEventListener('DOMContentLoaded', () => {
    // Load components
    const loadComponent = async (id, path) => {
        try {
            const response = await fetch(`/components/${path}`);
            const html = await response.text();
            document.getElementById(id).innerHTML = html;
        } catch (error) {
            console.error(`Failed to load component ${path}:`, error);
        }
    };

    // Load navigation and other components
    loadComponent('nav-placeholder', 'navbar.html');
    loadComponent('footer-placeholder', 'footer.html');

    // Initialize modules
    authModule.init();
    themeManager.init({
        initial: 'default',
        presets: {
            default: {
                primary: '#3B82F6',
                secondary: '#1E40AF',
                background: '#0F172A',
                text: '#F3F4F6'
            },
            dark: {
                primary: '#1E40AF',
                secondary: '#1E3A8A',
                background: '#0F172A',
                text: '#E5E7EB'
            }
        }
    });
    soundManager.init();

    // Create stars background
    const createStars = () => {
        const stars = document.getElementById('stars');
        const count = 100;
        
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 3}s`;
            stars.appendChild(star);
        }
    };

    // Initialize features
    createStars();
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