import { authModule } from './auth-module.js';
import { soundManager } from './sound-manager.js';
import { animationManager } from './animation-manager.js';
import { visualizationUtils } from './utils/visualization-utils.js';
import { metricsUtils } from './utils/metrics-utils.js';
import { MATH_CONFIG } from './config/math-config.js';

class ParentDashboard {
    constructor() {
        this.currentChild = null;
        this.settings = {};
        this.currentSessionId = null;
        this.updateInterval = 5000; // 5 seconds default update interval
        this.isIdle = false;
        this.idleTimeout = 60000; // 1 minute
        this.lastActivityTime = Date.now();
        this.meters = new Map();
        this.charts = new Map();
        
        this.initializeEventListeners();
        this.loadSettings();
        this.initializeWebSocket();
        this.startPerformanceMonitoring();
    }

    initializeEventListeners() {
        // Settings form submission
        document.querySelector('form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        // Notification toggles
        document.querySelectorAll('.switch input[type="checkbox"]').forEach(toggle => {
            toggle.addEventListener('change', () => {
                this.updateNotificationSettings(toggle);
            });
        });

        // Time inputs
        document.querySelectorAll('input[type="time"]').forEach(input => {
            input.addEventListener('change', () => {
                this.updateAccessTime(input);
            });
        });

        // Study time limit select
        document.querySelector('select[name="time-limit"]')?.addEventListener('change', (e) => {
            this.updateTimeLimit(e.target.value);
        });

        // Content filter select
        document.querySelector('select[name="content-filter"]')?.addEventListener('change', (e) => {
            this.updateContentFilter(e.target.value);
        });

        // Track user activity
        document.addEventListener('mousemove', () => this.resetIdleTimer());
        document.addEventListener('keypress', () => this.resetIdleTimer());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.isIdle = true;
                this.adjustUpdateFrequency();
            } else {
                this.resetIdleTimer();
            }
        });

        // Handle widget customization
        document.querySelectorAll('.widget-container').forEach(container => {
            this.initializeDragAndDrop(container);
        });
    }

    async loadDashboardData() {
        try {
            const response = await fetch('/api/parent/dashboard');
            if (!response.ok) throw new Error('Failed to load dashboard data');
            
            const data = await response.json();
            this.updateDashboard(data);
            
            // Play success sound
            soundManager.playCorrect();
            
            return data;
        } catch (error) {
            console.error('Error loading dashboard:', error);
            soundManager.playWrong();
            authModule.showFeedback('加载数据失败', 'error');
            return null;
        }
    }

    updateDashboard(data) {
        this.updateChildrenCards(data.children);
        this.updateLearningProgress(data.progress);
        this.updateRecentActivities(data.activities);
        this.updateAchievements(data.achievements);
    }

    updateChildrenCards(children) {
        const container = document.querySelector('.children-container');
        if (!container) return;

        container.innerHTML = children.map(child => `
            <div class="child-card bg-gray-800 rounded-xl p-6 slide-in" data-child-id="${child.id}">
                <div class="flex items-center mb-4">
                    <img src="${child.avatar}" alt="${child.name}的头像" class="w-16 h-16 rounded-full mr-4">
                    <div>
                        <h3 class="text-xl font-bold">${child.name}</h3>
                        <p class="text-gray-400">${child.age}岁</p>
                    </div>
                </div>
                <div class="space-y-4">
                    <div>
                        <div class="flex justify-between mb-1">
                            <span>总体进度</span>
                            <span>${child.progress}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-bar-fill" style="width: ${child.progress}%"></div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <p class="text-2xl font-bold text-green-400">${child.completedCourses}</p>
                            <p class="text-sm text-gray-400">完成课程</p>
                        </div>
                        <div>
                            <p class="text-2xl font-bold text-yellow-400">${child.achievements}</p>
                            <p class="text-sm text-gray-400">获得成就</p>
                        </div>
                    </div>
                    <button class="btn-child w-full" onclick="parentDashboard.showChildDetails('${child.id}')">
                        查看详情
                    </button>
                </div>
            </div>
        `).join('');

        // Add animation
        const cards = container.querySelectorAll('.child-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                animationManager.addSlideInAnimation(card, 'bottom', {
                    duration: 300,
                    delay: index * 100
                });
            }, index * 100);
        });
    }

    updateLearningProgress(progress) {
        const container = document.querySelector('.learning-progress');
        if (!container) return;

        Object.entries(progress).forEach(([subject, value]) => {
            const progressBar = container.querySelector(`.progress-bar-fill.${subject.toLowerCase()}`);
            if (progressBar) {
                progressBar.style.width = `${value}%`;
                progressBar.parentElement.previousElementSibling.querySelector('span:last-child').textContent = `${value}%`;
            }
        });
    }

    updateRecentActivities(activities) {
        const container = document.querySelector('.activities-container');
        if (!container) return;

        container.innerHTML = activities.map(activity => `
            <div class="flex items-start slide-in">
                <div class="activity-indicator ${activity.type} mr-3"></div>
                <div>
                    <p class="font-medium">${activity.description}</p>
                    <p class="text-sm text-gray-400">${activity.time}</p>
                </div>
            </div>
        `).join('');

        // Add animation
        const items = container.querySelectorAll('.slide-in');
        items.forEach((item, index) => {
            setTimeout(() => {
                animationManager.addSlideInAnimation(item, 'right', {
                    duration: 300,
                    delay: index * 100
                });
            }, index * 100);
        });
    }

    updateAchievements(achievements) {
        const container = document.querySelector('.achievements-container');
        if (!container) return;

        container.innerHTML = achievements.map(achievement => `
            <div class="text-center">
                <div class="achievement-badge ${achievement.unlocked ? '' : 'locked'} bg-${achievement.color}-400">
                    <span class="text-2xl">${achievement.icon}</span>
                </div>
                <p class="text-sm mt-2">${achievement.name}</p>
            </div>
        `).join('');

        // Add hover animation
        const badges = container.querySelectorAll('.achievement-badge');
        badges.forEach(badge => {
            badge.addEventListener('mouseenter', () => {
                if (!badge.classList.contains('locked')) {
                    animationManager.addBounceAnimation(badge, {
                        duration: 300,
                        scale: 1.1
                    });
                }
            });
        });
    }

    async showChildDetails(childId) {
        try {
            const response = await fetch(`/api/parent/children/${childId}`);
            if (!response.ok) throw new Error('Failed to load child details');
            
            const data = await response.json();
            this.currentChild = data;
            
            // Update UI with detailed information
            this.updateDetailedView(data);
            
            // Play success sound
            soundManager.playCorrect();
        } catch (error) {
            console.error('Error loading child details:', error);
            soundManager.playWrong();
            authModule.showFeedback('加载详细信息失败', 'error');
        }
    }

    updateDetailedView(data) {
        // Implementation for showing detailed child progress
        // This would typically involve updating multiple sections of the UI
        // with detailed learning progress, time spent, achievements, etc.
    }

    async loadSettings() {
        try {
            const response = await fetch('/api/parent/settings');
            if (!response.ok) throw new Error('Failed to load settings');
            
            this.settings = await response.json();
            this.updateSettingsForm();
        } catch (error) {
            console.error('Error loading settings:', error);
            authModule.showFeedback('加载设置失败', 'error');
        }
    }

    updateSettingsForm() {
        // Update time limit select
        const timeLimitSelect = document.querySelector('select[name="time-limit"]');
        if (timeLimitSelect) {
            timeLimitSelect.value = this.settings.timeLimit;
        }

        // Update access time inputs
        const startTime = document.querySelector('input[name="start-time"]');
        const endTime = document.querySelector('input[name="end-time"]');
        if (startTime && endTime) {
            startTime.value = this.settings.accessTime.start;
            endTime.value = this.settings.accessTime.end;
        }

        // Update content filter select
        const filterSelect = document.querySelector('select[name="content-filter"]');
        if (filterSelect) {
            filterSelect.value = this.settings.contentFilter;
        }

        // Update notification toggles
        Object.entries(this.settings.notifications).forEach(([key, value]) => {
            const toggle = document.querySelector(`input[name="${key}"]`);
            if (toggle) {
                toggle.checked = value;
            }
        });
    }

    async saveSettings() {
        try {
            const formData = new FormData(document.querySelector('form'));
            const settings = {
                timeLimit: formData.get('time-limit'),
                accessTime: {
                    start: formData.get('start-time'),
                    end: formData.get('end-time')
                },
                contentFilter: formData.get('content-filter'),
                notifications: {
                    dailyReport: formData.get('daily-report') === 'on',
                    achievements: formData.get('achievements') === 'on',
                    timeWarning: formData.get('time-warning') === 'on',
                    courseCompletion: formData.get('course-completion') === 'on'
                }
            };

            const response = await fetch('/api/parent/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            if (!response.ok) throw new Error('Failed to save settings');

            this.settings = settings;
            soundManager.playCorrect();
            authModule.showFeedback('设置已保存', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            soundManager.playWrong();
            authModule.showFeedback('保存设置失败', 'error');
        }
    }

    async updateNotificationSettings(toggle) {
        try {
            const setting = toggle.name;
            const enabled = toggle.checked;

            const response = await fetch('/api/parent/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    setting,
                    enabled
                })
            });

            if (!response.ok) throw new Error('Failed to update notification settings');

            this.settings.notifications[setting] = enabled;
            soundManager.playCorrect();
        } catch (error) {
            console.error('Error updating notification settings:', error);
            soundManager.playWrong();
            authModule.showFeedback('更新通知设置失败', 'error');
            
            // Revert toggle state
            toggle.checked = !toggle.checked;
        }
    }

    async updateAccessTime(input) {
        try {
            const type = input.name === 'start-time' ? 'start' : 'end';
            const time = input.value;

            const response = await fetch('/api/parent/access-time', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type,
                    time
                })
            });

            if (!response.ok) throw new Error('Failed to update access time');

            this.settings.accessTime[type] = time;
            soundManager.playCorrect();
        } catch (error) {
            console.error('Error updating access time:', error);
            soundManager.playWrong();
            authModule.showFeedback('更新访问时间失败', 'error');
            
            // Revert input value
            input.value = this.settings.accessTime[type];
        }
    }

    async updateTimeLimit(limit) {
        try {
            const response = await fetch('/api/parent/time-limit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ limit })
            });

            if (!response.ok) throw new Error('Failed to update time limit');

            this.settings.timeLimit = limit;
            soundManager.playCorrect();
        } catch (error) {
            console.error('Error updating time limit:', error);
            soundManager.playWrong();
            authModule.showFeedback('更新时间限制失败', 'error');
            
            // Revert select value
            const select = document.querySelector('select[name="time-limit"]');
            if (select) {
                select.value = this.settings.timeLimit;
            }
        }
    }

    async updateContentFilter(level) {
        try {
            const response = await fetch('/api/parent/content-filter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ level })
            });

            if (!response.ok) throw new Error('Failed to update content filter');

            this.settings.contentFilter = level;
            soundManager.playCorrect();
        } catch (error) {
            console.error('Error updating content filter:', error);
            soundManager.playWrong();
            authModule.showFeedback('更新内容过滤失败', 'error');
            
            // Revert select value
            const select = document.querySelector('select[name="content-filter"]');
            if (select) {
                select.value = this.settings.contentFilter;
            }
        }
    }

    async initialize(sessionId) {
        this.currentSessionId = sessionId;
        await this.initializeProgressMeters();
        this.startRealTimeUpdates();
    }

    initializeWebSocket() {
        try {
            this.ws = new WebSocket('ws://localhost:8080/dashboard');
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealtimeUpdate(data);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.fallbackToPolling();
            };
        } catch (error) {
            console.error('WebSocket initialization failed:', error);
            this.fallbackToPolling();
        }
    }

    fallbackToPolling() {
        console.log('Falling back to polling updates');
        this.usePolling = true;
        this.startRealTimeUpdates();
    }

    resetIdleTimer() {
        this.lastActivityTime = Date.now();
        if (this.isIdle) {
            this.isIdle = false;
            this.adjustUpdateFrequency();
        }
    }

    adjustUpdateFrequency() {
        if (this.isIdle) {
            this.updateInterval = 30000; // 30 seconds when idle
        } else {
            this.updateInterval = 5000; // 5 seconds when active
        }
    }

    async initializeProgressMeters() {
        const meterTypes = ['accuracy', 'speed', 'improvement'];
        const container = document.querySelector('.progress-meters-container');

        for (const type of meterTypes) {
            const meterElement = document.createElement('div');
            meterElement.className = `progress-meter ${type}-meter`;
            container.appendChild(meterElement);

            this.meters.set(type, {
                element: meterElement,
                currentValue: 0,
                targetValue: 0
            });
        }

        await this.updateProgressMeters();
    }

    async updateProgressMeters() {
        try {
            const config = await visualizationUtils.getProgressMeterConfig(this.currentSessionId);
            
            for (const [type, meter] of this.meters) {
                const meterConfig = config[type];
                meter.targetValue = meterConfig.value;

                this.animateProgressMeter(meter, meterConfig);
                this.updateMeterColor(meter.element, meterConfig.color);
                this.updateMeterLabel(meter.element, type, meterConfig);
            }
        } catch (error) {
            console.error('Error updating progress meters:', error);
        }
    }

    animateProgressMeter(meter, config) {
        const startValue = meter.currentValue;
        const endValue = config.value;
        const duration = 1000; // 1 second animation
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            meter.currentValue = startValue + (endValue - startValue) * progress;
            this.updateMeterValue(meter.element, meter.currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    updateMeterValue(element, value) {
        const progressBar = element.querySelector('.progress-bar');
        const valueDisplay = element.querySelector('.value-display');
        
        progressBar.style.width = `${value}%`;
        valueDisplay.textContent = `${Math.round(value)}%`;
    }

    updateMeterColor(element, color) {
        const progressBar = element.querySelector('.progress-bar');
        progressBar.style.backgroundColor = color;
    }

    updateMeterLabel(element, type, config) {
        const label = element.querySelector('.meter-label');
        const threshold = element.querySelector('.threshold-marker');
        
        label.textContent = this.getMeterLabel(type);
        threshold.style.left = `${config.threshold}%`;
    }

    getMeterLabel(type) {
        switch (type) {
            case 'accuracy': return 'Accuracy Rate';
            case 'speed': return 'Response Speed';
            case 'improvement': return 'Overall Improvement';
            default: return type.charAt(0).toUpperCase() + type.slice(1);
        }
    }

    startRealTimeUpdates() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }

        const update = async () => {
            if (!this.currentSessionId) return;

            if (this.usePolling) {
                await this.updateProgressMeters();
            }
            // WebSocket updates are handled by handleRealtimeUpdate
        };

        this.updateTimer = setInterval(update, this.updateInterval);
        update(); // Initial update
    }

    handleRealtimeUpdate(data) {
        if (data.type === 'metrics' && data.sessionId === this.currentSessionId) {
            this.updateProgressMeters();
        }
    }

    startPerformanceMonitoring() {
        this.performanceStats = {
            updateTimes: [],
            errorCount: 0,
            lastWarning: 0
        };

        // Monitor performance
        const measurePerformance = async () => {
            const start = performance.now();
            await this.updateProgressMeters();
            const duration = performance.now() - start;

            this.performanceStats.updateTimes.push(duration);
            if (this.performanceStats.updateTimes.length > 10) {
                this.performanceStats.updateTimes.shift();
            }

            this.checkPerformance();
        };

        setInterval(measurePerformance, 30000); // Check every 30 seconds
    }

    checkPerformance() {
        const avgUpdateTime = this.performanceStats.updateTimes.reduce((a, b) => a + b, 0) / 
            this.performanceStats.updateTimes.length;

        if (avgUpdateTime > 1000) { // Warning if updates take more than 1 second
            this.handlePerformanceWarning('High update latency detected');
        }

        if (this.performanceStats.errorCount > 5) {
            this.handlePerformanceWarning('Multiple update failures detected');
        }
    }

    handlePerformanceWarning(message) {
        const now = Date.now();
        if (now - this.performanceStats.lastWarning > 300000) { // 5 minutes between warnings
            console.warn(`Performance Warning: ${message}`);
            this.performanceStats.lastWarning = now;
            
            // Notify parent about performance issues
            const notification = document.createElement('div');
            notification.className = 'performance-warning';
            notification.textContent = `Dashboard Performance Alert: ${message}`;
            document.querySelector('.notifications-container').appendChild(notification);

            setTimeout(() => notification.remove(), 5000);
        }
    }

    initializeDragAndDrop(container) {
        let draggedElement = null;

        container.addEventListener('dragstart', (e) => {
            draggedElement = e.target;
            e.target.classList.add('dragging');
        });

        container.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(container, e.clientY);
            const draggable = document.querySelector('.dragging');
            
            if (afterElement) {
                container.insertBefore(draggable, afterElement);
            } else {
                container.appendChild(draggable);
            }
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.widget:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    destroy() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        if (this.ws) {
            this.ws.close();
        }
        this.meters.clear();
        this.charts.clear();
    }
}

// Export singleton instance
export const parentDashboard = new ParentDashboard(); 
