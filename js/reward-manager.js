import { COURSE_CONFIG, STORAGE_KEYS, API_ENDPOINTS } from './config.js';
import { soundManager } from './sound-manager.js';
import { animationManager } from './animation-manager.js';

class RewardManager {
    constructor() {
        this.achievements = new Map();
        this.rewards = new Map();
        this.mascots = new Map();
        this.progressData = {
            overall: 0,
            chapters: new Map(),
            exercises: new Map()
        };

        // 初始化
        this.initializeAchievements();
        this.initializeMascots();
        this.loadProgress();
    }

    // 初始化成就系统
    initializeAchievements() {
        // 章节完成成就
        this.achievements.set('CHAPTER_COMPLETE', {
            id: 'chapter_complete',
            title: '章节完成',
            description: '完成一个学习章节',
            icon: '🌟',
            animation: 'celebrate',
            sound: 'achievement',
            requirements: {
                type: 'chapter_complete',
                count: 1
            }
        });

        // 满分成就
        this.achievements.set('PERFECT_SCORE', {
            id: 'perfect_score',
            title: '完美表现',
            description: '获得一次练习满分',
            icon: '🏆',
            animation: 'sparkle',
            sound: 'achievement',
            requirements: {
                type: 'exercise_score',
                score: 100
            }
        });

        // 快速学习者成就
        this.achievements.set('FAST_LEARNER', {
            id: 'fast_learner',
            title: '快速学习者',
            description: '在30分钟内完成一个章节',
            icon: '⚡',
            animation: 'speed',
            sound: 'levelUp',
            requirements: {
                type: 'chapter_time',
                minutes: 30
            }
        });

        // 持续学习成就
        this.achievements.set('CONSISTENT_PRACTICE', {
            id: 'consistent_practice',
            title: '坚持不懈',
            description: '连续7天学习',
            icon: '📚',
            animation: 'bounce',
            sound: 'achievement',
            requirements: {
                type: 'daily_login',
                days: 7
            }
        });
    }

    // 初始化吉祥物系统
    initializeMascots() {
        this.mascots.set('default', {
            name: '小智',
            image: 'assets/mascots/default.png',
            animations: {
                idle: 'bounce',
                celebrate: 'celebrate',
                encourage: 'wave'
            },
            messages: {
                welcome: '欢迎回来！准备好开始今天的学习了吗？',
                encourage: '你做得很棒！继续加油！',
                celebrate: '太厉害了！你获得了新的成就！',
                levelUp: '恭喜你完成了这个章节！'
            }
        });
    }

    // 更新进度
    async updateProgress(data) {
        try {
            const { chapterId, exerciseId, score, timeSpent } = data;
            
            // 更新章节进度
            if (chapterId) {
                const chapterProgress = this.progressData.chapters.get(chapterId) || {
                    completed: false,
                    exercises: new Map(),
                    timeSpent: 0
                };
                
                chapterProgress.timeSpent += timeSpent || 0;
                this.progressData.chapters.set(chapterId, chapterProgress);
                
                // 检查章节完成成就
                if (!chapterProgress.completed && this.isChapterComplete(chapterId)) {
                    chapterProgress.completed = true;
                    await this.unlockAchievement('CHAPTER_COMPLETE');
                    
                    // 检查快速学习者成就
                    if (chapterProgress.timeSpent <= 30 * 60 * 1000) {
                        await this.unlockAchievement('FAST_LEARNER');
                    }
                }
            }
            
            // 更新练习进度
            if (exerciseId && score !== undefined) {
                const exerciseProgress = {
                    score,
                    timestamp: new Date().toISOString()
                };
                this.progressData.exercises.set(exerciseId, exerciseProgress);
                
                // 检查满分成就
                if (score === COURSE_CONFIG.SCORING.PERFECT) {
                    await this.unlockAchievement('PERFECT_SCORE');
                }
            }
            
            // 计算总体进度
            this.calculateOverallProgress();
            
            // 保存进度
            await this.saveProgress();
            
            // 显示进度更新动画
            this.showProgressAnimation();
            
            return true;
        } catch (error) {
            console.error('Error updating progress:', error);
            return false;
        }
    }

    // 解锁成就
    async unlockAchievement(achievementId) {
        const achievement = this.achievements.get(achievementId);
        if (!achievement || this.isAchievementUnlocked(achievementId)) {
            return false;
        }

        try {
            // 播放成就音效
            soundManager.playSound(achievement.sound);

            // 创建成就通知元素
            const notification = document.createElement('div');
            notification.className = 'achievement-notification';
            notification.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-content">
                    <h3>${achievement.title}</h3>
                    <p>${achievement.description}</p>
                </div>
            `;
            document.body.appendChild(notification);

            // 添加动画
            animationManager.addSlideInAnimation(notification, 'top', {
                duration: 500,
                onComplete: () => {
                    // 显示吉祥物祝贺动画
                    this.showMascotAnimation('celebrate');
                    
                    // 3秒后消失
                    setTimeout(() => {
                        animationManager.addSlideInAnimation(notification, 'right', {
                            duration: 500,
                            onComplete: () => notification.remove()
                        });
                    }, 3000);
                }
            });

            // 保存成就
            await this.saveAchievement(achievementId);

            return true;
        } catch (error) {
            console.error('Error unlocking achievement:', error);
            return false;
        }
    }

    // 显示吉祥物动画
    showMascotAnimation(animationType) {
        const mascot = this.mascots.get('default');
        const mascotElement = document.querySelector('.mascot');
        if (mascotElement && mascot.animations[animationType]) {
            animationManager[`add${mascot.animations[animationType]}Animation`](
                mascotElement,
                { duration: 1000 }
            );
            
            // 显示对应消息
            const messageElement = document.createElement('div');
            messageElement.className = 'mascot-message';
            messageElement.textContent = mascot.messages[animationType];
            mascotElement.appendChild(messageElement);
            
            // 消息动画
            animationManager.addFadeInAnimation(messageElement, {
                duration: 300,
                onComplete: () => {
                    setTimeout(() => {
                        animationManager.addFadeOutAnimation(messageElement, {
                            duration: 300,
                            onComplete: () => messageElement.remove()
                        });
                    }, 2000);
                }
            });
        }
    }

    // 显示进度更新动画
    showProgressAnimation() {
        const progressBar = document.querySelector('.overall-progress');
        if (progressBar) {
            // 更新进度条宽度
            progressBar.style.width = `${this.progressData.overall}%`;
            
            // 添加进度条动画
            animationManager.addBounceAnimation(progressBar, {
                duration: 500,
                scale: 1.1
            });
            
            // 如果达到某些里程碑，显示特殊动画
            if (this.progressData.overall >= 100) {
                this.showCompletionCelebration();
            } else if (this.progressData.overall % 25 === 0) {
                this.showMilestoneAnimation();
            }
        }
    }

    // 显示完成庆祝动画
    showCompletionCelebration() {
        // 创建庆祝动画容器
        const celebration = document.createElement('div');
        celebration.className = 'completion-celebration';
        document.body.appendChild(celebration);

        // 添加烟花动画
        for (let i = 0; i < 5; i++) {
            const firework = document.createElement('div');
            firework.className = 'firework';
            celebration.appendChild(firework);
            
            // 随机位置和延迟
            const delay = i * 200;
            const left = Math.random() * 100;
            firework.style.left = `${left}%`;
            
            setTimeout(() => {
                animationManager.addCelebrationAnimation(firework, {
                    duration: 1000,
                    onComplete: () => {
                        if (i === 4) {
                            setTimeout(() => {
                                animationManager.addFadeOutAnimation(celebration, {
                                    duration: 500,
                                    onComplete: () => celebration.remove()
                                });
                            }, 1000);
                        }
                    }
                });
            }, delay);
        }

        // 播放庆祝音效
        soundManager.playLevelUp();
        
        // 显示吉祥物祝贺
        this.showMascotAnimation('celebrate');
    }

    // 显示里程碑动画
    showMilestoneAnimation() {
        const milestone = document.createElement('div');
        milestone.className = 'milestone-notification';
        milestone.innerHTML = `
            <div class="milestone-icon">🎉</div>
            <div class="milestone-content">
                <h3>达成新的里程碑！</h3>
                <p>完成了 ${this.progressData.overall}% 的课程内容</p>
            </div>
        `;
        document.body.appendChild(milestone);

        // 添加动画
        animationManager.addSlideInAnimation(milestone, 'bottom', {
            duration: 500,
            onComplete: () => {
                setTimeout(() => {
                    animationManager.addSlideInAnimation(milestone, 'bottom', {
                        duration: 500,
                        onComplete: () => milestone.remove()
                    });
                }, 2000);
            }
        });

        // 播放音效
        soundManager.playAchievement();
    }

    // 计算总体进度
    calculateOverallProgress() {
        const totalChapters = document.querySelectorAll('.chapter-link').length;
        const completedChapters = Array.from(this.progressData.chapters.values())
            .filter(chapter => chapter.completed).length;
        
        this.progressData.overall = Math.round((completedChapters / totalChapters) * 100);
    }

    // 检查章节是否完成
    isChapterComplete(chapterId) {
        const chapter = this.progressData.chapters.get(chapterId);
        if (!chapter) return false;

        const exercises = Array.from(chapter.exercises.values());
        return exercises.every(exercise => exercise.score >= COURSE_CONFIG.SCORING.PASS);
    }

    // 检查成就是否已解锁
    isAchievementUnlocked(achievementId) {
        return this.achievements.get(achievementId)?.unlocked || false;
    }

    // 加载进度
    async loadProgress() {
        try {
            // 从本地存储加载
            const savedProgress = localStorage.getItem(STORAGE_KEYS.COURSE_PROGRESS);
            if (savedProgress) {
                const data = JSON.parse(savedProgress);
                this.progressData = data;
            }

            // 从服务器同步
            const response = await fetch(API_ENDPOINTS.PROGRESS);
            if (response.ok) {
                const serverData = await response.json();
                this.mergeProgress(serverData);
            }

            this.calculateOverallProgress();
            return true;
        } catch (error) {
            console.error('Error loading progress:', error);
            return false;
        }
    }

    // 保存进度
    async saveProgress() {
        try {
            // 保存到本地存储
            localStorage.setItem(
                STORAGE_KEYS.COURSE_PROGRESS,
                JSON.stringify(this.progressData)
            );

            // 同步到服务器
            await fetch(API_ENDPOINTS.PROGRESS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.progressData)
            });

            return true;
        } catch (error) {
            console.error('Error saving progress:', error);
            return false;
        }
    }

    // 保存成就
    async saveAchievement(achievementId) {
        try {
            const achievement = this.achievements.get(achievementId);
            achievement.unlocked = true;
            achievement.unlockedAt = new Date().toISOString();

            // 保存到本地存储
            localStorage.setItem(
                STORAGE_KEYS.ACHIEVEMENTS,
                JSON.stringify(Array.from(this.achievements.entries()))
            );

            // 同步到服务器
            await fetch(API_ENDPOINTS.ACHIEVEMENTS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    achievementId,
                    unlockedAt: achievement.unlockedAt
                })
            });

            return true;
        } catch (error) {
            console.error('Error saving achievement:', error);
            return false;
        }
    }

    // 合并本地和服务器进度
    mergeProgress(serverData) {
        // 合并章节进度
        serverData.chapters.forEach((serverChapter, chapterId) => {
            const localChapter = this.progressData.chapters.get(chapterId);
            if (!localChapter || serverChapter.timestamp > localChapter.timestamp) {
                this.progressData.chapters.set(chapterId, serverChapter);
            }
        });

        // 合并练习进度
        serverData.exercises.forEach((serverExercise, exerciseId) => {
            const localExercise = this.progressData.exercises.get(exerciseId);
            if (!localExercise || serverExercise.timestamp > localExercise.timestamp) {
                this.progressData.exercises.set(exerciseId, serverExercise);
            }
        });
    }
}

// 导出单例实例
export const rewardManager = new RewardManager(); 