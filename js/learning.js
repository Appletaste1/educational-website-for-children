import { soundManager } from './sound-manager.js';
import { animationManager } from './animation-manager.js';
import { rewardManager } from './reward-manager.js';

// Video Player Controls
class VideoPlayer {
    constructor(videoElement) {
        this.video = videoElement;
        this.isPlaying = false;
        this.volume = 1.0;
        this.initializeControls();
    }

    initializeControls() {
        // Play/Pause button
        const playPauseBtn = document.querySelector('.play-pause-btn');
        playPauseBtn?.addEventListener('click', () => {
            soundManager.playClick();
            animationManager.addBounceAnimation(playPauseBtn);
            this.togglePlayPause();
        });

        // Volume control
        const volumeSlider = document.querySelector('.volume-slider');
        volumeSlider?.addEventListener('input', (e) => {
            this.adjustVolume(e.target.value);
            soundManager.setVolume(e.target.value);
        });

        // Progress bar
        this.video?.addEventListener('timeupdate', () => this.updateProgressBar());
        const progressBar = document.querySelector('.progress-bar');
        progressBar?.addEventListener('click', (e) => this.seek(e));
    }

    togglePlayPause() {
        if (this.video.paused) {
            this.video.play();
            this.isPlaying = true;
        } else {
            this.video.pause();
            this.isPlaying = false;
        }
        this.updatePlayPauseButton();
    }

    adjustVolume(value) {
        this.volume = value;
        if (this.video) {
            this.video.volume = value;
        }
    }

    updateProgressBar() {
        const progressBar = document.querySelector('.progress-bar-fill');
        if (this.video && progressBar) {
            const progress = (this.video.currentTime / this.video.duration) * 100;
            progressBar.style.width = `${progress}%`;
        }
    }

    seek(event) {
        if (!this.video) return;
        const progressBar = document.querySelector('.progress-bar');
        const rect = progressBar.getBoundingClientRect();
        const pos = (event.clientX - rect.left) / rect.width;
        this.video.currentTime = pos * this.video.duration;
    }

    updatePlayPauseButton() {
        const playPauseBtn = document.querySelector('.play-pause-btn');
        if (playPauseBtn) {
            playPauseBtn.innerHTML = this.isPlaying ? '暂停' : '播放';
        }
    }
}

// Course Content Management
class CourseManager {
    constructor() {
        this.currentChapter = 1;
        this.progress = {};
        this.achievements = {};
        this.startTime = new Date();
        this.initializeEventListeners();
        this.loadProgress();
    }

    initializeEventListeners() {
        // Chapter navigation
        document.querySelectorAll('.chapter-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                soundManager.playClick();
                animationManager.addBounceAnimation(link);
                const chapter = e.target.dataset.chapter;
                this.loadChapter(chapter);
            });
        });

        // Exercise submission
        document.querySelectorAll('.exercise-submit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                soundManager.playClick();
                animationManager.addBounceAnimation(btn);
                const exerciseId = e.target.dataset.exerciseId;
                this.submitExercise(exerciseId);
            });
        });

        // Answer options
        document.querySelectorAll('.answer-input').forEach(input => {
            input.addEventListener('click', () => {
                soundManager.playClick();
                animationManager.addBounceAnimation(input);
            });
        });

        // Navigation buttons
        document.querySelectorAll('.btn-child').forEach(btn => {
            btn.addEventListener('click', () => {
                soundManager.playClick();
                animationManager.addBounceAnimation(btn);
            });
        });

        // Auto-save progress periodically
        setInterval(() => this.saveProgress(), 30000); // Every 30 seconds

        // Mobile swipe navigation
        this.initializeSwipeNavigation();
    }

    initializeSwipeNavigation() {
        let touchStartX = 0;
        let touchEndX = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, false);
        
        // Handle swipe
        this.handleSwipe = () => {
            const swipeThreshold = 50;
            const diff = touchEndX - touchStartX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swipe right - previous chapter
                    this.navigateChapter('prev');
                } else {
                    // Swipe left - next chapter
                    this.navigateChapter('next');
                }
            }
        };
    }

    navigateChapter(direction) {
        const chapters = Array.from(document.querySelectorAll('.chapter-link'));
        const currentIndex = chapters.findIndex(link => 
            link.dataset.chapter === this.currentChapter.toString()
        );
        
        let newIndex;
        if (direction === 'next') {
            newIndex = Math.min(currentIndex + 1, chapters.length - 1);
        } else {
            newIndex = Math.max(currentIndex - 1, 0);
        }
        
        const newChapter = chapters[newIndex].dataset.chapter;
        if (newChapter !== this.currentChapter.toString()) {
            this.loadChapter(newChapter);
        }
    }

    async loadChapter(chapter) {
        try {
            const response = await fetch(`/api/chapters/${chapter}`);
            if (!response.ok) throw new Error('Failed to load chapter');
            
            const data = await response.json();
            this.currentChapter = chapter;
            
            // 使用滑入动画更新内容
            const contentArea = document.querySelector('.content-area');
            animationManager.addFadeOutAnimation(contentArea, {
                duration: 300,
                onComplete: () => {
                    // 更新内容
                    contentArea.innerHTML = data.content;
                    document.querySelector('.video-player video').src = data.videoUrl;
                    
                    // 显示新内容
                    animationManager.addSlideInAnimation(contentArea, 'right', {
                        duration: 500
                    });
                }
            });
            
            // 更新进度
            const timeSpent = new Date() - this.startTime;
            await rewardManager.updateProgress({
                chapterId: chapter,
                timeSpent
            });
            
            // 更新侧边栏高亮
            this.updateSidebarHighlight(chapter);
            
            // 朗读章节标题
            const chapterTitle = document.querySelector('.chapter-link.active').textContent;
            soundManager.speak(`正在进入${chapterTitle}`);
            
            // 播放成功音效
            soundManager.playLevelUp();
            
            // 显示成功提示
            this.showLoadSuccess();

            // 重置章节开始时间
            this.startTime = new Date();
        } catch (error) {
            console.error('Error loading chapter:', error);
            soundManager.playWrong();
            this.showLoadError();
        }
    }

    async submitExercise(exerciseId) {
        const answers = this.collectExerciseAnswers(exerciseId);
        try {
            const response = await fetch('/api/exercises/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    exerciseId,
                    answers
                })
            });

            if (!response.ok) throw new Error('Failed to submit exercise');
            
            const result = await response.json();
            
            // 更新进度和成就
            await rewardManager.updateProgress({
                chapterId: this.currentChapter,
                exerciseId,
                score: result.score
            });
            
            // 播放相应的音效
            if (result.passed) {
                soundManager.playCorrect();
                // 朗读祝贺语
                soundManager.speak('真棒！答对了！');
            } else {
                soundManager.playWrong();
                // 朗读鼓励语
                soundManager.speak('继续加油！');
            }
            
            this.showExerciseResult(result);
            
            return true;
        } catch (error) {
            console.error('Error submitting exercise:', error);
            soundManager.playWrong();
            this.showSubmitError();
            return false;
        }
    }

    collectExerciseAnswers(exerciseId) {
        const exerciseContainer = document.querySelector(`#exercise-${exerciseId}`);
        const answers = {};
        exerciseContainer.querySelectorAll('.answer-input').forEach(input => {
            answers[input.name] = input.value;
        });
        return answers;
    }

    showExerciseResult(result) {
        const resultContainer = document.querySelector('.exercise-result');
        resultContainer.innerHTML = `
            <div class="result-card ${result.passed ? 'success' : 'needs-improvement'}">
                <h3>${result.passed ? '真棒！答对了！' : '继续加油！'}</h3>
                <p>得分：${result.score}分</p>
                <div class="feedback">${result.feedback}</div>
            </div>
        `;
        
        // 添加结果卡片的动画
        animationManager.addSlideInAnimation(resultContainer.firstElementChild, 'up', {
            duration: 500
        });
    }

    updateProgress(chapter, exerciseId = null, score = null) {
        if (!this.progress[chapter]) {
            this.progress[chapter] = {
                visited: true,
                exercises: {}
            };
        }
        
        if (exerciseId && score !== null) {
            this.progress[chapter].exercises[exerciseId] = score;
        }
        
        this.saveProgress();
        this.updateProgressDisplay();
        
        // 检查是否解锁了新成就
        this.checkAchievements();
    }

    checkAchievements() {
        const totalChapters = document.querySelectorAll('.chapter-link').length;
        const completedChapters = Object.keys(this.progress).length;
        
        // 完成第一章
        if (completedChapters === 1 && !this.achievements?.firstChapter) {
            this.unlockAchievement('firstChapter', '完成第一章！');
        }
        
        // 完成所有章节
        if (completedChapters === totalChapters && !this.achievements?.allChapters) {
            this.unlockAchievement('allChapters', '完成所有章节！');
        }
        
        // 获得满分
        const hasFullScore = Object.values(this.progress).some(chapter => 
            Object.values(chapter.exercises).some(score => score === 100)
        );
        if (hasFullScore && !this.achievements?.fullScore) {
            this.unlockAchievement('fullScore', '获得满分！');
        }
    }

    unlockAchievement(id, title) {
        // 保存成就
        if (!this.achievements) {
            this.achievements = {};
        }
        this.achievements[id] = {
            unlocked: true,
            timestamp: new Date().toISOString()
        };
        
        // 显示成就通知
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">🏆</div>
            <div class="achievement-text">
                <h4>解锁新成就！</h4>
                <p>${title}</p>
            </div>
        `;
        document.body.appendChild(notification);
        
        // 添加动画
        animationManager.addSlideInAnimation(notification, 'left', {
            duration: 500,
            onComplete: () => {
                // 3秒后消失
                setTimeout(() => {
                    animationManager.addSlideInAnimation(notification, 'right', {
                        duration: 500,
                        onComplete: () => notification.remove()
                    });
                }, 3000);
            }
        });
        
        // 播放成就音效
        soundManager.playAchievement();
        
        // 朗读成就
        soundManager.speak(`恭喜你解锁了新成就：${title}`);
    }

    saveProgress() {
        try {
            localStorage.setItem('courseProgress', JSON.stringify({
                lastChapter: this.currentChapter,
                progress: this.progress,
                achievements: this.achievements,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }

    loadProgress() {
        try {
            const saved = localStorage.getItem('courseProgress');
            if (saved) {
                const data = JSON.parse(saved);
                this.progress = data.progress;
                this.achievements = data.achievements;
                this.currentChapter = data.lastChapter;
                this.updateProgressDisplay();
                return true;
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        }
        return false;
    }

    updateProgressDisplay() {
        // Update progress indicators in sidebar
        document.querySelectorAll('.chapter-link').forEach(link => {
            const chapter = link.dataset.chapter;
            const chapterProgress = this.progress[chapter];
            
            if (chapterProgress?.visited) {
                link.classList.add('visited');
                // 添加完成动画
                if (!link.dataset.animated) {
                    animationManager.addBounceAnimation(link);
                    link.dataset.animated = 'true';
                }
            }
            
            if (chapterProgress?.exercises) {
                const completedExercises = Object.values(chapterProgress.exercises).filter(score => score > 0).length;
                const progressIndicator = link.querySelector('.progress-indicator');
                if (progressIndicator) {
                    progressIndicator.textContent = `${completedExercises} 完成`;
                }
            }
        });

        // Update overall progress with animation
        const totalChapters = document.querySelectorAll('.chapter-link').length;
        const completedChapters = Object.keys(this.progress).length;
        const progressPercentage = (completedChapters / totalChapters) * 100;
        
        const overallProgress = document.querySelector('.overall-progress');
        if (overallProgress) {
            // 使用动画过渡更新进度条
            overallProgress.style.transition = 'width 0.5s ease-out';
            overallProgress.style.width = `${progressPercentage}%`;
            overallProgress.setAttribute('aria-valuenow', progressPercentage);
        }
    }

    updateSidebarHighlight(chapter) {
        document.querySelectorAll('.chapter-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.chapter === chapter) {
                link.classList.add('active');
                // 添加高亮动画
                animationManager.addBounceAnimation(link);
            }
        });
    }

    showLoadSuccess() {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = '课程内容加载成功！';
        document.body.appendChild(toast);
        
        // 添加滑入动画
        animationManager.addSlideInAnimation(toast, 'left', {
            duration: 300,
            onComplete: () => {
                // 3秒后消失
                setTimeout(() => {
                    animationManager.addFadeOutAnimation(toast, {
                        duration: 300,
                        onComplete: () => toast.remove()
                    });
                }, 3000);
            }
        });
    }

    showLoadError() {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = '加载失败，请重试';
        document.body.appendChild(toast);
        
        // 添加摇晃动画
        animationManager.addShakeAnimation(toast, {
            duration: 500,
            intensity: 10,
            onComplete: () => {
                setTimeout(() => {
                    animationManager.addFadeOutAnimation(toast, {
                        duration: 300,
                        onComplete: () => toast.remove()
                    });
                }, 3000);
            }
        });
    }

    showSubmitError() {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = '提交失败，请重试';
        document.body.appendChild(toast);
        
        // 添加摇晃动画
        animationManager.addShakeAnimation(toast, {
            duration: 500,
            intensity: 10,
            onComplete: () => {
                setTimeout(() => {
                    animationManager.addFadeOutAnimation(toast, {
                        duration: 300,
                        onComplete: () => toast.remove()
                    });
                }, 3000);
            }
        });
    }
}

// Mobile Navigation
class MobileNavigation {
    constructor() {
        this.menuButton = document.querySelector('.menu-toggle');
        this.sidebar = document.querySelector('.sidebar');
        this.overlay = document.querySelector('#sidebar-overlay');
        this.isOpen = false;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 菜单按钮点击事件
        this.menuButton?.addEventListener('click', () => this.toggleMenu());

        // 遮罩点击事件
        this.overlay?.addEventListener('click', () => this.closeMenu());

        // 处理移动端滑动手势
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        }, false);

        // 处理窗口大小变化
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768 && this.isOpen) {
                this.closeMenu();
            }
        });
    }

    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        this.sidebar?.classList.add('open');
        this.overlay?.classList.remove('hidden');
        this.menuButton?.setAttribute('aria-expanded', 'true');
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
    }

    closeMenu() {
        this.sidebar?.classList.remove('open');
        this.overlay?.classList.add('hidden');
        this.menuButton?.setAttribute('aria-expanded', 'false');
        this.isOpen = false;
        document.body.style.overflow = '';
    }

    handleSwipe(startX, endX) {
        const swipeThreshold = 50;
        const diff = endX - startX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0 && !this.isOpen) {
                // 向右滑动，打开菜单
                this.openMenu();
            } else if (diff < 0 && this.isOpen) {
                // 向左滑动，关闭菜单
                this.closeMenu();
            }
        }
    }
}

// Volume Controls
class VolumeControls {
    constructor() {
        this.volumePanel = document.querySelector('#volume-controls');
        this.bgmSlider = document.querySelector('#bgm-volume');
        this.sfxSlider = document.querySelector('#sfx-volume');
        this.voiceSlider = document.querySelector('#voice-volume');
        this.isOpen = false;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 音量控制面板切换按钮
        const volumeToggle = document.createElement('button');
        volumeToggle.className = 'fixed bottom-4 right-4 p-3 bg-gray-800 rounded-full shadow-lg';
        volumeToggle.innerHTML = `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 010-7.072m12.728 2.828l-2.829-2.829m-2.828 2.829l2.828-2.829M6.343 9.172l2.829 2.828-2.829 2.829" />
            </svg>
        `;
        volumeToggle.setAttribute('aria-label', '音量控制');
        document.body.appendChild(volumeToggle);

        volumeToggle.addEventListener('click', () => {
            soundManager.playClick();
            this.togglePanel();
        });

        // 音量滑块事件
        this.bgmSlider?.addEventListener('input', (e) => {
            soundManager.setBackgroundMusicVolume(e.target.value);
        });

        this.sfxSlider?.addEventListener('input', (e) => {
            soundManager.setSoundEffectsVolume(e.target.value);
        });

        this.voiceSlider?.addEventListener('input', (e) => {
            soundManager.setVoiceVolume(e.target.value);
        });

        // 点击面板外关闭
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.volumePanel?.contains(e.target) && e.target !== volumeToggle) {
                this.closePanel();
            }
        });
    }

    togglePanel() {
        if (this.isOpen) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    openPanel() {
        this.volumePanel?.classList.remove('hidden');
        animationManager.addSlideInAnimation(this.volumePanel, 'left', {
            duration: 300
        });
        this.isOpen = true;
    }

    closePanel() {
        if (this.volumePanel) {
            animationManager.addFadeOutAnimation(this.volumePanel, {
                duration: 300,
                onComplete: () => {
                    this.volumePanel?.classList.add('hidden');
                }
            });
        }
        this.isOpen = false;
    }
}

// Loading Manager
class LoadingManager {
    constructor() {
        this.overlay = document.querySelector('.loading-overlay');
        this.loadingText = this.overlay?.querySelector('.loading-text');
    }

    show(message = '正在加载...') {
        if (this.loadingText) {
            this.loadingText.textContent = message;
        }
        this.overlay?.classList.remove('hidden');
        animationManager.addFadeInAnimation(this.overlay, {
            duration: 300
        });
    }

    hide() {
        if (this.overlay) {
            animationManager.addFadeOutAnimation(this.overlay, {
                duration: 300,
                onComplete: () => {
                    this.overlay?.classList.add('hidden');
                }
            });
        }
    }
}

// Initialize when page loads
window.addEventListener('load', () => {
    // 初始化移动端导航
    const mobileNav = new MobileNavigation();

    // 初始化音量控制
    const volumeControls = new VolumeControls();

    // 初始化加载管理器
    const loadingManager = new LoadingManager();

    // 播放背景音乐
    soundManager.playBackgroundMusic();

    // Initialize video player if video element exists
    const videoElement = document.querySelector('.video-player video');
    if (videoElement) {
        new VideoPlayer(videoElement);
    }

    // Initialize course manager
    const courseManager = new CourseManager();

    // 初始化成就徽章墙
    const achievementWall = document.querySelector('.achievement-wall');
    if (achievementWall) {
        rewardManager.achievements.forEach((achievement, id) => {
            const badge = document.createElement('div');
            badge.className = `achievement-badge ${achievement.unlocked ? '' : 'locked'}`;
            badge.innerHTML = `
                <div class="icon">${achievement.icon}</div>
                <div class="title">${achievement.title}</div>
                <div class="description">${achievement.description}</div>
                ${achievement.unlocked ? `
                    <div class="unlock-date">
                        解锁于 ${new Date(achievement.unlockedAt).toLocaleDateString()}
                    </div>
                ` : ''}
            `;
            achievementWall.appendChild(badge);
        });
    }

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // 页面不可见时暂停背景音乐和视频
            soundManager.stopBackgroundMusic();
            if (videoElement && !videoElement.paused) {
                videoElement.pause();
            }
        } else {
            // 页面可见时恢复背景音乐
            soundManager.playBackgroundMusic();
        }
    });

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && videoElement) {
            e.preventDefault();
            soundManager.playClick();
            if (videoElement.paused) {
                videoElement.play();
            } else {
                videoElement.pause();
            }
        }
    });

    // 添加移动端触摸反馈
    document.addEventListener('touchstart', (e) => {
        const target = e.target;
        if (target.classList.contains('btn-child') || 
            target.classList.contains('answer-input') ||
            target.classList.contains('chapter-link')) {
            animationManager.addBounceAnimation(target, {
                scale: 1.1,
                duration: 200
            });
        }
    });

    // 导出全局实例供其他模块使用
    window.app = {
        mobileNav,
        volumeControls,
        loadingManager,
        soundManager,
        animationManager,
        rewardManager
    };
}); 
