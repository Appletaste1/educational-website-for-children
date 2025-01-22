// Auth module
export const authModule = {
    user: null,
    isAuthenticated: false,

    init() {
        this.checkAuthStatus();
        this.setupAuthUI();
        this.setupEventListeners();
    },

    checkAuthStatus() {
        // Check local storage for auth token
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                // Verify token and get user info
                this.user = JSON.parse(localStorage.getItem('user_info'));
                this.isAuthenticated = true;
                this.updateUI();
            } catch (error) {
                console.error('Failed to parse user info:', error);
                this.logout();
            }
        }
    },

    setupAuthUI() {
        // Get auth container
        const container = document.querySelector('.auth-container');
        if (!container) return;

        // Create auth buttons
        if (!this.isAuthenticated) {
            container.innerHTML = `
                <button id="login-btn" class="btn-secondary">登录</button>
                <button id="signup-btn" class="btn-primary">注册</button>
            `;
        } else {
            container.innerHTML = `
                <div class="user-info">
                    <span>欢迎, ${this.user.name}</span>
                    <button id="logout-btn" class="btn-secondary">退出</button>
                </div>
            `;
        }
    },

    setupEventListeners() {
        // Login button
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.showAuthModal('login');
            });
        }

        // Signup button
        const signupBtn = document.getElementById('signup-btn');
        if (signupBtn) {
            signupBtn.addEventListener('click', () => {
                this.showAuthModal('signup');
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    },

    showAuthModal(type) {
        const modal = document.getElementById('auth-modal');
        const content = modal.querySelector('.modal-content');

        // Set modal content based on type
        content.innerHTML = type === 'login' ? this.getLoginForm() : this.getSignupForm();

        // Show modal
        modal.classList.remove('hidden');

        // Setup form submission
        const form = content.querySelector('form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (type === 'login') {
                this.handleLogin(form);
            } else {
                this.handleSignup(form);
            }
        });

        // Setup close button
        const closeBtn = content.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    },

    getLoginForm() {
        return `
            <div class="auth-form">
                <button class="close-btn" aria-label="Close">&times;</button>
                <h2>登录</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label for="email">邮箱</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">密码</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <button type="submit" class="btn-primary">登录</button>
                </form>
            </div>
        `;
    },

    getSignupForm() {
        return `
            <div class="auth-form">
                <button class="close-btn" aria-label="Close">&times;</button>
                <h2>注册</h2>
                <form id="signup-form">
                    <div class="form-group">
                        <label for="name">姓名</label>
                        <input type="text" id="name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="email">邮箱</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">密码</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <div class="form-group">
                        <label for="confirm-password">确认密码</label>
                        <input type="password" id="confirm-password" name="confirm-password" required>
                    </div>
                    <button type="submit" class="btn-primary">注册</button>
                </form>
            </div>
        `;
    },

    async handleLogin(form) {
        const email = form.email.value;
        const password = form.password.value;

        try {
            // TODO: Replace with actual API call
            const response = await this.mockLoginAPI(email, password);
            
            // Store auth data
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('user_info', JSON.stringify(response.user));
            
            // Update state
            this.user = response.user;
            this.isAuthenticated = true;
            
            // Update UI
            this.updateUI();
            
            // Close modal
            document.getElementById('auth-modal').classList.add('hidden');
        } catch (error) {
            console.error('Login failed:', error);
            this.showError('登录失败，请检查邮箱和密码');
        }
    },

    async handleSignup(form) {
        const name = form.name.value;
        const email = form.email.value;
        const password = form.password.value;
        const confirmPassword = form['confirm-password'].value;

        if (password !== confirmPassword) {
            this.showError('两次输入的密码不一致');
            return;
        }

        try {
            // TODO: Replace with actual API call
            const response = await this.mockSignupAPI(name, email, password);
            
            // Store auth data
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('user_info', JSON.stringify(response.user));
            
            // Update state
            this.user = response.user;
            this.isAuthenticated = true;
            
            // Update UI
            this.updateUI();
            
            // Close modal
            document.getElementById('auth-modal').classList.add('hidden');
        } catch (error) {
            console.error('Signup failed:', error);
            this.showError('注册失败，请稍后重试');
        }
    },

    logout() {
        // Clear auth data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        
        // Update state
        this.user = null;
        this.isAuthenticated = false;
        
        // Update UI
        this.updateUI();
    },

    updateUI() {
        this.setupAuthUI();
        this.setupEventListeners();
        
        // Dispatch auth state change event
        window.dispatchEvent(new CustomEvent('authstatechange', {
            detail: { 
                isAuthenticated: this.isAuthenticated,
                user: this.user
            }
        }));
    },

    showError(message) {
        const feedback = document.querySelector('.feedback-container');
        if (feedback) {
            feedback.innerHTML = `
                <div class="error-message">
                    ${message}
                    <button class="close-btn" onclick="this.parentElement.remove()">&times;</button>
                </div>
            `;
        }
    },

    // Mock API calls for development
    mockLoginAPI(email, password) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    token: 'mock_token_' + Date.now(),
                    user: {
                        id: 1,
                        name: '测试用户',
                        email: email
                    }
                });
            }, 500);
        });
    },

    mockSignupAPI(name, email, password) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    token: 'mock_token_' + Date.now(),
                    user: {
                        id: 1,
                        name: name,
                        email: email
                    }
                });
            }, 500);
        });
    }
};
