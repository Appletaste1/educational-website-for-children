import { rewardManager } from './reward-manager.js';
import { soundManager } from './sound-manager.js';
import { animationManager } from './animation-manager.js';

class AuthModule {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.sessionTimer = null;
        this.initializeEventListeners();
        this.checkSession();
    }

    initializeEventListeners() {
        // Login form submission
        document.querySelector('#login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Registration form submission
        document.querySelector('#register-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });

        // Parent consent form submission
        document.querySelector('#consent-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleParentalConsent();
        });

        // Password reset request
        document.querySelector('#reset-password-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePasswordReset();
        });

        // Session activity monitoring
        document.addEventListener('mousemove', () => this.resetSessionTimer());
        document.addEventListener('keypress', () => this.resetSessionTimer());
        document.addEventListener('click', () => this.resetSessionTimer());
    }

    async handleLogin() {
        try {
            const email = document.querySelector('#email').value;
            const password = document.querySelector('#password').value;
            const mfaCode = document.querySelector('#mfa-code')?.value;

            // Show loading state
            this.showLoadingState('login-btn');

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    mfaCode
                })
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();

            if (data.requiresMFA) {
                // Show MFA input field
                this.showMFAInput();
                return;
            }

            // Set session cookie with secure attributes
            document.cookie = `sessionId=${data.sessionId}; Secure; SameSite=Strict; HttpOnly`;
            
            this.currentUser = data.user;
            this.startSessionTimer();

            // Update UI
            this.updateAuthState();
            
            // Play success sound
            soundManager.playCorrect();
            
            // Show welcome message
            this.showFeedback('欢迎回来！', 'success');

            return true;
        } catch (error) {
            console.error('Login error:', error);
            soundManager.playWrong();
            this.showFeedback('登录失败，请重试', 'error');
            return false;
        } finally {
            this.hideLoadingState('login-btn');
        }
    }

    async handleRegistration() {
        try {
            const email = document.querySelector('#reg-email').value;
            const password = document.querySelector('#reg-password').value;
            const confirmPassword = document.querySelector('#confirm-password').value;
            const userType = document.querySelector('#user-type').value;

            // Validate password strength
            if (!this.validatePassword(password)) {
                this.showFeedback('密码不符合安全要求', 'error');
                return false;
            }

            // Validate password match
            if (password !== confirmPassword) {
                this.showFeedback('两次输入的密码不匹配', 'error');
                return false;
            }

            // Show loading state
            this.showLoadingState('register-btn');

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    userType
                })
            });

            if (!response.ok) {
                throw new Error('Registration failed');
            }

            const data = await response.json();

            if (userType === 'child') {
                // Show parental consent form
                this.showParentalConsentForm(data.userId);
                return;
            }

            // Show success message
            soundManager.playCorrect();
            this.showFeedback('注册成功！请登录', 'success');

            // Switch to login form
            this.showLoginForm();

            return true;
        } catch (error) {
            console.error('Registration error:', error);
            soundManager.playWrong();
            this.showFeedback('注册失败，请重试', 'error');
            return false;
        } finally {
            this.hideLoadingState('register-btn');
        }
    }

    async handleParentalConsent() {
        try {
            const childId = document.querySelector('#child-id').value;
            const parentEmail = document.querySelector('#parent-email').value;
            const consentChecked = document.querySelector('#consent-checkbox').checked;

            if (!consentChecked) {
                this.showFeedback('请确认同意隐私政策', 'error');
                return false;
            }

            // Show loading state
            this.showLoadingState('consent-btn');

            const response = await fetch('/api/auth/parental-consent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    childId,
                    parentEmail
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit parental consent');
            }

            // Show success message
            soundManager.playCorrect();
            this.showFeedback('已发送确认邮件至家长邮箱', 'success');

            return true;
        } catch (error) {
            console.error('Parental consent error:', error);
            soundManager.playWrong();
            this.showFeedback('提交失败，请重试', 'error');
            return false;
        } finally {
            this.hideLoadingState('consent-btn');
        }
    }

    async handlePasswordReset() {
        try {
            const email = document.querySelector('#reset-email').value;

            // Show loading state
            this.showLoadingState('reset-btn');

            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                throw new Error('Failed to request password reset');
            }

            // Show success message
            soundManager.playCorrect();
            this.showFeedback('重置密码链接已发送至邮箱', 'success');

            return true;
        } catch (error) {
            console.error('Password reset error:', error);
            soundManager.playWrong();
            this.showFeedback('请求失败，请重试', 'error');
            return false;
        } finally {
            this.hideLoadingState('reset-btn');
        }
    }

    validatePassword(password) {
        // At least 8 characters
        if (password.length < 8) return false;

        // At least one uppercase letter
        if (!/[A-Z]/.test(password)) return false;

        // At least one lowercase letter
        if (!/[a-z]/.test(password)) return false;

        // At least one number
        if (!/[0-9]/.test(password)) return false;

        // At least one special character
        if (!/[!@#$%^&*]/.test(password)) return false;

        return true;
    }

    startSessionTimer() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }

        this.sessionTimer = setTimeout(() => {
            this.handleSessionTimeout();
        }, this.sessionTimeout);
    }

    resetSessionTimer() {
        if (this.currentUser) {
            this.startSessionTimer();
        }
    }

    async handleSessionTimeout() {
        // Clear current session
        this.currentUser = null;
        document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        // Show timeout message
        this.showFeedback('会话已过期，请重新登录', 'warning');

        // Redirect to login page
        window.location.href = '/login';
    }

    async checkSession() {
        try {
            const response = await fetch('/api/auth/check-session');
            if (!response.ok) {
                throw new Error('Invalid session');
            }

            const data = await response.json();
            this.currentUser = data.user;
            this.startSessionTimer();
            this.updateAuthState();

            return true;
        } catch (error) {
            console.error('Session check error:', error);
            return false;
        }
    }

    updateAuthState() {
        const authContainer = document.querySelector('.auth-container');
        if (!authContainer) return;

        if (this.currentUser) {
            // Show user info and logout button
            authContainer.innerHTML = `
                <div class="user-info">
                    <span class="user-name">${this.currentUser.name}</span>
                    <button class="logout-btn btn-child" onclick="authModule.handleLogout()">退出登录</button>
                </div>
            `;
        } else {
            // Show login/register buttons
            authContainer.innerHTML = `
                <button class="login-btn btn-child" onclick="authModule.showLoginForm()">登录</button>
                <button class="register-btn btn-child" onclick="authModule.showRegisterForm()">注册</button>
            `;
        }
    }

    showLoginForm() {
        const modalContent = document.querySelector('.modal-content');
        if (!modalContent) return;

        modalContent.innerHTML = `
            <h2 class="text-2xl font-bold mb-6">登录</h2>
            <form id="login-form" class="space-y-4">
                <div>
                    <label for="email" class="block mb-1">邮箱</label>
                    <input type="email" id="email" required class="w-full px-4 py-2 rounded-lg bg-gray-800">
                </div>
                <div>
                    <label for="password" class="block mb-1">密码</label>
                    <input type="password" id="password" required class="w-full px-4 py-2 rounded-lg bg-gray-800">
                </div>
                <div id="mfa-input" class="hidden">
                    <label for="mfa-code" class="block mb-1">验证码</label>
                    <input type="text" id="mfa-code" class="w-full px-4 py-2 rounded-lg bg-gray-800">
                </div>
                <button type="submit" class="btn-child w-full">登录</button>
                <div class="text-center">
                    <a href="#" onclick="authModule.showPasswordResetForm()" class="text-blue-400 hover:text-blue-300">忘记密码？</a>
                </div>
            </form>
        `;
    }

    showRegisterForm() {
        const modalContent = document.querySelector('.modal-content');
        if (!modalContent) return;

        modalContent.innerHTML = `
            <h2 class="text-2xl font-bold mb-6">注册</h2>
            <form id="register-form" class="space-y-4">
                <div>
                    <label for="reg-email" class="block mb-1">邮箱</label>
                    <input type="email" id="reg-email" required class="w-full px-4 py-2 rounded-lg bg-gray-800">
                </div>
                <div>
                    <label for="reg-password" class="block mb-1">密码</label>
                    <input type="password" id="reg-password" required class="w-full px-4 py-2 rounded-lg bg-gray-800">
                    <p class="text-sm text-gray-400 mt-1">密码必须包含大小写字母、数字和特殊符号，长度至少8位</p>
                </div>
                <div>
                    <label for="confirm-password" class="block mb-1">确认密码</label>
                    <input type="password" id="confirm-password" required class="w-full px-4 py-2 rounded-lg bg-gray-800">
                </div>
                <div>
                    <label for="user-type" class="block mb-1">用户类型</label>
                    <select id="user-type" required class="w-full px-4 py-2 rounded-lg bg-gray-800">
                        <option value="parent">家长</option>
                        <option value="child">儿童</option>
                    </select>
                </div>
                <button type="submit" class="btn-child w-full">注册</button>
            </form>
        `;
    }

    showParentalConsentForm(childId) {
        const modalContent = document.querySelector('.modal-content');
        if (!modalContent) return;

        modalContent.innerHTML = `
            <h2 class="text-2xl font-bold mb-6">家长同意书</h2>
            <form id="consent-form" class="space-y-4">
                <input type="hidden" id="child-id" value="${childId}">
                <div>
                    <label for="parent-email" class="block mb-1">家长邮箱</label>
                    <input type="email" id="parent-email" required class="w-full px-4 py-2 rounded-lg bg-gray-800">
                </div>
                <div class="flex items-start">
                    <input type="checkbox" id="consent-checkbox" required class="mt-1">
                    <label for="consent-checkbox" class="ml-2 text-sm">
                        我同意《隐私政策》中关于收集和使用儿童信息的条款
                    </label>
                </div>
                <button type="submit" class="btn-child w-full">提交</button>
            </form>
        `;
    }

    showPasswordResetForm() {
        const modalContent = document.querySelector('.modal-content');
        if (!modalContent) return;

        modalContent.innerHTML = `
            <h2 class="text-2xl font-bold mb-6">重置密码</h2>
            <form id="reset-password-form" class="space-y-4">
                <div>
                    <label for="reset-email" class="block mb-1">邮箱</label>
                    <input type="email" id="reset-email" required class="w-full px-4 py-2 rounded-lg bg-gray-800">
                </div>
                <button type="submit" class="btn-child w-full">发送重置链接</button>
            </form>
        `;
    }

    showMFAInput() {
        const mfaInput = document.querySelector('#mfa-input');
        if (mfaInput) {
            mfaInput.classList.remove('hidden');
        }
    }

    showLoadingState(buttonId) {
        const button = document.querySelector(`#${buttonId}`);
        if (button) {
            button.disabled = true;
            button.innerHTML = '<span class="loading-spinner"></span> 处理中...';
        }
    }

    hideLoadingState(buttonId) {
        const button = document.querySelector(`#${buttonId}`);
        if (button) {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || '提交';
        }
    }

    showFeedback(message, type) {
        const feedback = document.createElement('div');
        feedback.className = `feedback ${type}`;
        feedback.textContent = message;
        
        document.querySelector('.feedback-container')?.appendChild(feedback);
        
        animationManager.addSlideInAnimation(feedback, 'bottom', {
            duration: 300,
            onComplete: () => {
                setTimeout(() => {
                    animationManager.addSlideOutAnimation(feedback, 'bottom', {
                        duration: 300,
                        onComplete: () => feedback.remove()
                    });
                }, 2000);
            }
        });
    }

    async handleLogout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            
            // Clear session
            this.currentUser = null;
            document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            
            // Clear session timer
            if (this.sessionTimer) {
                clearTimeout(this.sessionTimer);
            }
            
            // Update UI
            this.updateAuthState();
            
            // Show success message
            this.showFeedback('已安全退出', 'success');
            
            // Redirect to home page
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            this.showFeedback('退出失败，请重试', 'error');
        }
    }
}

// Export singleton instance
export const authModule = new AuthModule(); 