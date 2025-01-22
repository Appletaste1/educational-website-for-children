// Theme manager module
export const themeManager = {
    currentTheme: 'default',
    presets: {},

    init(config = {}) {
        this.presets = config.presets || {};
        this.setTheme(config.initial || 'default');
        this.setupThemeToggle();
    },

    setTheme(themeName) {
        if (!this.presets[themeName]) {
            console.error(`Theme "${themeName}" not found`);
            return;
        }

        const theme = this.presets[themeName];
        this.currentTheme = themeName;

        // Apply theme variables to root
        const root = document.documentElement;
        Object.entries(theme).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value);
        });

        // Update theme attribute
        document.body.setAttribute('data-theme', themeName);

        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themechange', { 
            detail: { theme: themeName } 
        }));
    },

    setupThemeToggle() {
        // Add theme toggle button if it doesn't exist
        let toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) {
            toggleBtn = document.createElement('button');
            toggleBtn.id = 'theme-toggle';
            toggleBtn.className = 'theme-toggle';
            toggleBtn.setAttribute('aria-label', 'Toggle theme');
            document.body.appendChild(toggleBtn);
        }

        // Toggle between themes
        toggleBtn.addEventListener('click', () => {
            const themes = Object.keys(this.presets);
            const currentIndex = themes.indexOf(this.currentTheme);
            const nextIndex = (currentIndex + 1) % themes.length;
            this.setTheme(themes[nextIndex]);
        });
    }
}; 