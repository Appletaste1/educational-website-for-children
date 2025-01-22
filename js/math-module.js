import { soundManager } from './sound-manager.js';
import { animationManager } from './animation-manager.js';
import { rewardManager } from './reward-manager.js';
import { MATH_CONFIG } from './config/math-config.js';
import { loggingUtils } from './utils/logging-utils.js';
import { metricsUtils } from './utils/metrics-utils.js';

class MathModule {
    constructor() {
        this.currentExercise = null;
        this.score = 0;
        this.level = 1;
        this.streak = 0;
        this.lastAnswerTime = 0;
        this.sessionId = null;
        this.exercises = {
            addition_level1: {
                range: MATH_CONFIG.DIFFICULTY_LEVELS.BEGINNER.range,
                operations: ['+']
            },
            addition_level2: {
                range: MATH_CONFIG.DIFFICULTY_LEVELS.INTERMEDIATE.range,
                operations: ['+']
            },
            subtraction_level1: {
                range: MATH_CONFIG.DIFFICULTY_LEVELS.BEGINNER.range,
                operations: ['-']
            },
            subtraction_level2: {
                range: MATH_CONFIG.DIFFICULTY_LEVELS.INTERMEDIATE.range,
                operations: ['-']
            },
            number_recognition: {
                range: MATH_CONFIG.DIFFICULTY_LEVELS.BEGINNER.range
            }
        };

        // Initialize progress tracking
        this.progressTimer = setInterval(() => {
            this.saveProgress();
            this.updateAdaptiveDifficulty();
        }, MATH_CONFIG.PROGRESS.SAVE_INTERVAL);

        this.initializeEventListeners();
        this.initializeManipulatives();
        this.loadProgress();
        this.initializeSession();
    }

    async initializeSession() {
        this.sessionId = `session_${Date.now()}`;
        // Initialize session metrics
        await this.updateSessionMetrics();
    }

    async updateSessionMetrics() {
        try {
            const sessionMetrics = await metricsUtils.getSessionEngagementMetrics(this.sessionId);
            const performanceMetrics = await metricsUtils.getPerformanceMetrics(this.sessionId);
            
            // Update UI with metrics if needed
            this.updateMetricsDisplay(sessionMetrics, performanceMetrics);
            
            // Check for achievements based on metrics
            this.checkMetricBasedAchievements(sessionMetrics, performanceMetrics);
        } catch (error) {
            console.error('Error updating session metrics:', error);
        }
    }

    updateMetricsDisplay(sessionMetrics, performanceMetrics) {
        // Update progress indicators
        const progressContainer = document.querySelector('.progress-container');
        if (progressContainer) {
            progressContainer.innerHTML = `
                <div class="metric-item">
                    <span class="label">Completed:</span>
                    <span class="value">${sessionMetrics.tasksCompleted}</span>
                </div>
                <div class="metric-item">
                    <span class="label">Accuracy:</span>
                    <span class="value">${Math.round(performanceMetrics.accuracyRate * 100)}%</span>
                </div>
                <div class="metric-item">
                    <span class="label">Streak:</span>
                    <span class="value">${performanceMetrics.streakData.currentStreak}</span>
                </div>
            `;
        }
    }

    async checkMetricBasedAchievements(sessionMetrics, performanceMetrics) {
        const { ACHIEVEMENTS } = MATH_CONFIG;

        // Quick Learner achievement
        if (performanceMetrics.averageResponseTime <= 30 && sessionMetrics.tasksCompleted >= 5) {
            rewardManager.unlockAchievement(ACHIEVEMENTS.QUICK_LEARNER.id);
        }

        // Perfect Score achievement
        if (performanceMetrics.streakData.currentStreak >= 10) {
            rewardManager.unlockAchievement(ACHIEVEMENTS.PERFECT_SCORE.id);
        }

        // Math Master achievement
        if (this.level >= MATH_CONFIG.PROGRESS.MAX_LEVEL) {
            rewardManager.unlockAchievement(ACHIEVEMENTS.MATH_MASTER.id);
        }
    }

    async updateAdaptiveDifficulty() {
        try {
            const adaptabilityMetrics = await metricsUtils.getAdaptabilityMetrics(this.sessionId);
            const recommendations = adaptabilityMetrics.difficultyAdjustmentRecommendations;

            if (recommendations && recommendations.shouldAdjustDifficulty) {
                if (recommendations.direction === 'increase' && this.level < MATH_CONFIG.PROGRESS.MAX_LEVEL) {
                    this.levelUp();
                } else if (recommendations.direction === 'decrease' && this.level > 1) {
                    this.levelDown();
                }
            }

            // Update exercise parameters based on performance
            this.adjustExerciseParameters(adaptabilityMetrics);
        } catch (error) {
            console.error('Error updating adaptive difficulty:', error);
        }
    }

    adjustExerciseParameters(adaptabilityMetrics) {
        const { speedImprovement, accuracyImprovement } = adaptabilityMetrics;

        // Adjust time limits based on speed improvement
        for (const improvement of speedImprovement) {
            const exerciseConfig = this.exercises[improvement.exerciseType];
            if (exerciseConfig && improvement.improvement > 0.2) { // 20% improvement
                exerciseConfig.timeLimit = Math.max(
                    exerciseConfig.timeLimit * 0.9, // Reduce time limit by 10%
                    MATH_CONFIG.DIFFICULTY_LEVELS[this.getDifficultyLevel()].timeLimit / 2
                );
            }
        }

        // Adjust number ranges based on accuracy improvement
        if (accuracyImprovement > 0.1) { // 10% improvement
            for (const exerciseType in this.exercises) {
                const config = this.exercises[exerciseType];
                config.range.max = Math.min(
                    config.range.max + 5,
                    MATH_CONFIG.DIFFICULTY_LEVELS[this.getDifficultyLevel()].range.max
                );
            }
        }
    }

    initializeEventListeners() {
        // Exercise selection buttons
        document.querySelectorAll('.exercise-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                loggingUtils.logInteraction('exercise_selection', {
                    exerciseType: btn.dataset.exercise
                });
                this.startExercise(btn.dataset.exercise);
            });
        });

        // Number line interaction
        const numberLine = document.querySelector('.number-line');
        if (numberLine) {
            const marker = numberLine.querySelector('.marker');
            let isDragging = false;
            let startX;
            let markerLeft;

            marker.addEventListener('mousedown', (e) => {
                isDragging = true;
                startX = e.pageX - marker.offsetLeft;
                markerLeft = marker.offsetLeft;
                loggingUtils.logInteraction('number_line_start_drag', {
                    startPosition: markerLeft
                });
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                
                const x = e.pageX - startX;
                const lineWidth = numberLine.clientWidth - marker.clientWidth;
                const position = Math.max(0, Math.min(x, lineWidth));
                const value = Math.round((position / lineWidth) * 20);
                
                marker.style.left = `${position}px`;
                this.updateNumberLineValue(value);
                
                loggingUtils.logInteraction('number_line_drag', {
                    position,
                    value
                });
            });

            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    loggingUtils.logInteraction('number_line_end_drag', {
                        finalValue: parseInt(document.querySelector('.number-line-value')?.textContent || '0')
                    });
                }
                isDragging = false;
            });
        }
    }

    initializeManipulatives() {
        // Initialize counting blocks
        const blockContainer = document.querySelector('.counting-blocks');
        if (blockContainer) {
            for (let i = 0; i < 20; i++) {
                const block = document.createElement('div');
                block.className = 'counting-block bg-blue-500';
                block.addEventListener('click', () => this.toggleBlock(block));
                blockContainer.appendChild(block);
            }
        }
    }

    startExercise(type) {
        this.currentExercise = type;
        this.lastAnswerTime = Date.now();
        
        // Log exercise start
        loggingUtils.logExerciseStart(type, this.getDifficultyLevel());
        
        switch (type) {
            case 'addition_level1':
            case 'addition_level2':
            case 'subtraction_level1':
            case 'subtraction_level2':
                this.showArithmeticExercise(type);
                break;
            case 'number_recognition':
                this.showNumberRecognitionExercise();
                break;
        }

        soundManager.playSound(MATH_CONFIG.SOUNDS.START);
    }

    showArithmeticExercise(type) {
        const { range, operations } = this.exercises[type];
        const num1 = this.getRandomNumber(range.min, range.max);
        let num2;
        const operation = operations[0];

        if (operation === '-') {
            // For subtraction, ensure num1 is larger than num2
            num2 = this.getRandomNumber(range.min, num1);
        } else {
            num2 = this.getRandomNumber(range.min, range.max);
        }

        const exercise = document.createElement('div');
        exercise.className = 'text-center';
        exercise.innerHTML = `
            <div class="text-4xl mb-8">
                <span>${num1}</span>
                <span>${operation}</span>
                <span>${num2}</span>
                <span>=</span>
                <input type="number" class="answer-input" min="0" max="100">
            </div>
            <button class="btn-child check-answer">检查答案</button>
        `;

        const container = document.querySelector('.exercise-container');
        container.innerHTML = '';
        container.appendChild(exercise);

        // Add event listener for answer checking
        container.querySelector('.check-answer').addEventListener('click', () => {
            const answer = parseInt(container.querySelector('.answer-input').value);
            this.checkAnswer(num1, num2, operation, answer);
        });

        // Update manipulatives
        this.updateManipulatives(num1, num2, operation);
    }

    showNumberRecognitionExercise() {
        const { range } = this.exercises.number_recognition;
        const number = this.getRandomNumber(range.min, range.max);
        const options = this.generateOptions(number, range);

        const exercise = document.createElement('div');
        exercise.className = 'text-center';
        exercise.innerHTML = `
            <div class="text-4xl mb-8">
                <p class="mb-4">选择正确的数字：</p>
                <div class="number-display text-8xl mb-8">${number}</div>
                <div class="grid grid-cols-2 gap-4">
                    ${options.map(opt => `
                        <button class="option-btn" data-value="${opt}">${opt}</button>
                    `).join('')}
                </div>
            </div>
        `;

        const container = document.querySelector('.exercise-container');
        container.innerHTML = '';
        container.appendChild(exercise);

        // Add event listeners for options
        container.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const selectedValue = parseInt(btn.dataset.value);
                this.checkNumberRecognition(number, selectedValue);
            });
        });

        // Update number line
        this.updateNumberLine(number);
    }

    checkAnswer(num1, num2, operation, answer) {
        let correctAnswer;
        switch (operation) {
            case '+':
                correctAnswer = num1 + num2;
                break;
            case '-':
                correctAnswer = num1 - num2;
                break;
        }

        const timeTaken = (Date.now() - this.lastAnswerTime) / 1000;
        
        // Log the answer
        loggingUtils.logAnswer(
            this.currentExercise,
            num1,
            num2,
            operation,
            answer,
            correctAnswer,
            timeTaken
        );

        if (answer === correctAnswer) {
            this.handleCorrectAnswer(timeTaken);
        } else {
            this.handleIncorrectAnswer(correctAnswer);
        }
    }

    checkNumberRecognition(correct, selected) {
        const timeTaken = (Date.now() - this.lastAnswerTime) / 1000;
        
        // Log the answer
        loggingUtils.logAnswer(
            'number_recognition',
            correct,
            null,
            'recognition',
            selected,
            correct,
            timeTaken
        );

        if (correct === selected) {
            this.handleCorrectAnswer(timeTaken);
        } else {
            this.handleIncorrectAnswer(correct);
        }
    }

    async handleCorrectAnswer(timeTaken) {
        this.streak++;
        this.score++;

        // Calculate rewards
        let points = MATH_CONFIG.REWARDS.CORRECT_ANSWER;
        if (this.streak > 1) {
            points += MATH_CONFIG.REWARDS.STREAK_BONUS;
        }
        if (timeTaken < MATH_CONFIG.DIFFICULTY_LEVELS[this.getDifficultyLevel()].timeLimit / 2) {
            points += MATH_CONFIG.REWARDS.QUICK_ANSWER_BONUS;
        }

        // Update metrics and check achievements
        await this.updateSessionMetrics();

        soundManager.playSound(MATH_CONFIG.SOUNDS.CORRECT);
        this.showFeedback('太棒了！答对了！ 👏', 'success');
        
        // Check for level up based on metrics
        await this.checkForLevelUp();

        setTimeout(() => {
            this.startExercise(this.currentExercise);
        }, MATH_CONFIG.ANIMATIONS.FEEDBACK_DURATION);
    }

    async handleIncorrectAnswer(correctAnswer) {
        this.streak = 0;
        
        try {
            // Get error analysis
            const errorAnalysis = await metricsUtils.getErrorAnalysis(this.sessionId, this.currentExercise);
            
            // Customize feedback based on error patterns
            const feedback = this.generateCustomFeedback(errorAnalysis, correctAnswer);
            
            soundManager.playSound(MATH_CONFIG.SOUNDS.WRONG);
            this.showFeedback(feedback, 'error');

            // Update difficulty if needed
            if (errorAnalysis.problemAreas.length > 0) {
                this.adjustDifficultyForProblemAreas(errorAnalysis.problemAreas);
            }
        } catch (error) {
            console.error('Error handling incorrect answer:', error);
            // Fallback to basic feedback
            soundManager.playSound(MATH_CONFIG.SOUNDS.WRONG);
            this.showFeedback(`再试一次！正确答案是 ${correctAnswer}`, 'error');
        }
    }

    generateCustomFeedback(errorAnalysis, correctAnswer) {
        const { errorPatterns } = errorAnalysis;
        let feedback = `正确答案是 ${correctAnswer}。`;

        if (errorPatterns.operationConfusion > 0) {
            feedback += '记住检查运算符号！';
        } else if (errorPatterns.magnitudeErrors > 0) {
            feedback += '注意数字的大小！';
        } else if (errorPatterns.reversalErrors > 0) {
            feedback += '仔细看清数字的顺序！';
        } else if (errorPatterns.carryBorrowErrors > 0) {
            feedback += '注意进位/借位！';
        }

        return feedback;
    }

    adjustDifficultyForProblemAreas(problemAreas) {
        const mostProblematicArea = problemAreas[0];
        
        // Temporarily adjust difficulty for problem areas
        if (mostProblematicArea.area.includes('Double-digit')) {
            // Step back to single-digit problems temporarily
            this.exercises[this.currentExercise].range.max = 9;
        }
        
        // Schedule return to normal difficulty
        setTimeout(() => {
            this.restoreNormalDifficulty();
        }, 5 * 60000); // After 5 minutes
    }

    restoreNormalDifficulty() {
        const difficultyLevel = this.getDifficultyLevel();
        for (const exerciseType in this.exercises) {
            this.exercises[exerciseType].range = {
                ...MATH_CONFIG.DIFFICULTY_LEVELS[difficultyLevel].range
            };
        }
    }

    async checkForLevelUp() {
        try {
            const progressionMetrics = await metricsUtils.getProgressionMetrics(this.sessionId);
            const adaptabilityMetrics = await metricsUtils.getAdaptabilityMetrics(this.sessionId);

            const shouldLevelUp = 
                progressionMetrics.learningRate > 0.1 && // Positive learning trend
                adaptabilityMetrics.accuracyImprovement > 0.2 && // 20% accuracy improvement
                this.score % MATH_CONFIG.DIFFICULTY_LEVELS[this.getDifficultyLevel()].requiredScore === 0;

            if (shouldLevelUp) {
                this.levelUp();
            }
        } catch (error) {
            console.error('Error checking for level up:', error);
            // Fallback to basic level up check
            if (this.score % MATH_CONFIG.DIFFICULTY_LEVELS[this.getDifficultyLevel()].requiredScore === 0) {
                this.levelUp();
            }
        }
    }

    levelUp() {
        if (this.level >= MATH_CONFIG.PROGRESS.MAX_LEVEL) return;

        const oldLevel = this.level;
        this.level++;
        
        // Log level up event
        loggingUtils.logLevelUp(oldLevel, this.level, this.score);

        soundManager.playSound(MATH_CONFIG.SOUNDS.LEVEL_UP);
        
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div class="level-up-content">
                <h3>升级了！</h3>
                <p>你已经达到第 ${this.level} 级</p>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), MATH_CONFIG.ANIMATIONS.LEVEL_UP_DURATION);

        // Update exercise difficulty
        this.updateDifficulty();
        
        // Award level completion points
        this.score += MATH_CONFIG.REWARDS.LEVEL_COMPLETION;
    }

    levelDown() {
        if (this.level <= 1) return;

        const oldLevel = this.level;
        this.level--;
        
        // Log level change
        loggingUtils.logEvent('levelDown', {
            oldLevel,
            newLevel: this.level,
            reason: 'Performance below threshold'
        });

        soundManager.playSound(MATH_CONFIG.SOUNDS.WRONG);
        
        const notification = document.createElement('div');
        notification.className = 'level-change-notification';
        notification.innerHTML = `
            <div class="level-change-content">
                <h3>调整难度</h3>
                <p>让我们回到第 ${this.level} 级，巩固一下基础知识</p>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), MATH_CONFIG.ANIMATIONS.LEVEL_UP_DURATION);

        // Update exercise difficulty
        this.updateDifficulty();
    }

    updateDifficulty() {
        const currentExercise = this.exercises[this.currentExercise];
        if (currentExercise) {
            currentExercise.range.max += 10;
        }
    }

    updateManipulatives(num1, num2, operation) {
        const blocks = document.querySelectorAll('.counting-block');
        blocks.forEach((block, index) => {
            if (operation === '+') {
                block.classList.toggle('active', index < num1 + num2);
            } else {
                block.classList.toggle('active', index < num1);
                block.classList.toggle('subtracted', index < num2);
            }
        });
    }

    updateNumberLine(value) {
        const marker = document.querySelector('.marker');
        if (marker) {
            const lineWidth = marker.parentElement.clientWidth - marker.clientWidth;
            const position = (value / 20) * lineWidth;
            marker.style.left = `${position}px`;
        }
    }

    updateNumberLineValue(value) {
        const valueDisplay = document.querySelector('.number-line-value');
        if (valueDisplay) {
            valueDisplay.textContent = value;
        }
    }

    toggleBlock(block) {
        block.classList.toggle('active');
        soundManager.playClick();
    }

    getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    generateOptions(correct, range) {
        const options = [correct];
        while (options.length < 4) {
            const option = this.getRandomNumber(range.min, range.max);
            if (!options.includes(option)) {
                options.push(option);
            }
        }
        return this.shuffleArray(options);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    showFeedback(message, type) {
        const feedback = document.createElement('div');
        feedback.className = `feedback ${type}`;
        feedback.textContent = message;
        
        document.querySelector('.feedback-container').appendChild(feedback);
        
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

    getDifficultyLevel() {
        if (this.level <= 3) return 'BEGINNER';
        if (this.level <= 7) return 'INTERMEDIATE';
        return 'ADVANCED';
    }

    saveProgress() {
        const progress = {
            score: this.score,
            level: this.level,
            streak: this.streak,
            achievements: rewardManager.getUnlockedAchievements()
        };

        localStorage.setItem('math_progress', JSON.stringify(progress));
    }

    loadProgress() {
        const savedProgress = localStorage.getItem('math_progress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            this.score = progress.score;
            this.level = progress.level;
            this.streak = progress.streak;
        }
    }
}

// Export singleton instance
export const mathModule = new MathModule(); 
