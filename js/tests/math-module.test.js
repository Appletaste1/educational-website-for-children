import { mathModule } from '../math-module.js';
import { metricsUtils } from '../utils/metrics-utils.js';
import { loggingUtils } from '../utils/logging-utils.js';
import { MATH_CONFIG } from '../config/math-config.js';

// Mock dependencies
jest.mock('../utils/metrics-utils.js');
jest.mock('../utils/logging-utils.js');
jest.mock('../sound-manager.js', () => ({
    soundManager: {
        playSound: jest.fn()
    }
}));
jest.mock('../animation-manager.js', () => ({
    animationManager: {
        addSlideInAnimation: jest.fn(),
        addSlideOutAnimation: jest.fn()
    }
}));
jest.mock('../reward-manager.js', () => ({
    rewardManager: {
        unlockAchievement: jest.fn(),
        updateProgress: jest.fn()
    }
}));

// Mock DOM elements
document.body.innerHTML = `
    <div class="exercise-container"></div>
    <div class="feedback-container"></div>
    <div class="progress-container"></div>
    <div class="number-line">
        <div class="marker"></div>
    </div>
    <div class="counting-blocks"></div>
`;

// Test suite
describe('MathModule', () => {
    beforeEach(() => {
        // Reset module state
        mathModule.score = 0;
        mathModule.level = 1;
        mathModule.currentExercise = null;
        mathModule.streak = 0;
        
        // Clear all mocks
        jest.clearAllMocks();
        
        // Reset metrics utils mock implementations
        metricsUtils.getSessionEngagementMetrics.mockResolvedValue({
            timeOnTask: 300,
            tasksCompleted: 5,
            totalAttempts: 6,
            uniqueExerciseTypes: 2
        });
        
        metricsUtils.getPerformanceMetrics.mockResolvedValue({
            attemptsBeforeCorrect: 1.2,
            averageResponseTime: 2.5,
            accuracyRate: 0.8,
            streakData: {
                currentStreak: 3,
                maxStreak: 5,
                totalStreaks: 2
            }
        });
        
        metricsUtils.getProgressionMetrics.mockResolvedValue({
            levelsCompleted: 1,
            difficultyProgression: [],
            learningRate: 0.15,
            moduleCompletionTimes: []
        });
        
        metricsUtils.getAdaptabilityMetrics.mockResolvedValue({
            speedImprovement: [{ exerciseType: 'addition_level1', improvement: 0.25 }],
            accuracyImprovement: 0.3,
            difficultyAdjustmentRecommendations: {
                shouldAdjustDifficulty: false,
                direction: null,
                reason: null
            }
        });
    });

    test('should initialize with correct default values and session', async () => {
        expect(mathModule.score).toBe(0);
        expect(mathModule.level).toBe(1);
        expect(mathModule.currentExercise).toBeNull();
        expect(mathModule.sessionId).toMatch(/^session_\d+$/);
        
        // Verify metrics initialization
        expect(metricsUtils.getSessionEngagementMetrics).toHaveBeenCalled();
        expect(metricsUtils.getPerformanceMetrics).toHaveBeenCalled();
    });

    test('should update metrics display correctly', async () => {
        const sessionMetrics = {
            tasksCompleted: 10,
            totalAttempts: 12
        };
        
        const performanceMetrics = {
            accuracyRate: 0.85,
            streakData: {
                currentStreak: 5
            }
        };

        mathModule.updateMetricsDisplay(sessionMetrics, performanceMetrics);
        
        const progressContainer = document.querySelector('.progress-container');
        expect(progressContainer.innerHTML).toContain('10');
        expect(progressContainer.innerHTML).toContain('85%');
        expect(progressContainer.innerHTML).toContain('5');
    });

    test('should handle correct answer with metrics update', async () => {
        const timeTaken = 2.5;
        
        await mathModule.handleCorrectAnswer(timeTaken);
        
        expect(mathModule.score).toBe(1);
        expect(mathModule.streak).toBe(1);
        expect(metricsUtils.getSessionEngagementMetrics).toHaveBeenCalled();
        expect(metricsUtils.getPerformanceMetrics).toHaveBeenCalled();
    });

    test('should handle incorrect answer with error analysis', async () => {
        metricsUtils.getErrorAnalysis.mockResolvedValue({
            errorPatterns: {
                operationConfusion: 1,
                magnitudeErrors: 0,
                reversalErrors: 0,
                carryBorrowErrors: 0
            },
            problemAreas: [
                { area: 'Double-digit addition', count: 1 }
            ]
        });

        await mathModule.handleIncorrectAnswer(8);
        
        expect(mathModule.streak).toBe(0);
        expect(metricsUtils.getErrorAnalysis).toHaveBeenCalled();
        
        // Verify custom feedback
        const feedback = document.querySelector('.feedback-container').textContent;
        expect(feedback).toContain('记住检查运算符号');
    });

    test('should adjust difficulty based on problem areas', async () => {
        const problemAreas = [
            { area: 'Double-digit addition', count: 3 }
        ];

        mathModule.currentExercise = 'addition_level1';
        mathModule.adjustDifficultyForProblemAreas(problemAreas);
        
        expect(mathModule.exercises.addition_level1.range.max).toBe(9);
        
        // Fast-forward timers to test difficulty restoration
        jest.advanceTimersByTime(5 * 60000);
        
        expect(mathModule.exercises.addition_level1.range.max)
            .toBe(MATH_CONFIG.DIFFICULTY_LEVELS.BEGINNER.range.max);
    });

    test('should check for level up based on metrics', async () => {
        mathModule.score = MATH_CONFIG.DIFFICULTY_LEVELS.BEGINNER.requiredScore;
        
        metricsUtils.getProgressionMetrics.mockResolvedValue({
            learningRate: 0.15 // Above threshold
        });
        
        metricsUtils.getAdaptabilityMetrics.mockResolvedValue({
            accuracyImprovement: 0.25 // Above threshold
        });

        await mathModule.checkForLevelUp();
        
        expect(mathModule.level).toBe(2);
    });

    test('should not level up if metrics are below thresholds', async () => {
        mathModule.score = MATH_CONFIG.DIFFICULTY_LEVELS.BEGINNER.requiredScore;
        
        metricsUtils.getProgressionMetrics.mockResolvedValue({
            learningRate: 0.05 // Below threshold
        });
        
        metricsUtils.getAdaptabilityMetrics.mockResolvedValue({
            accuracyImprovement: 0.1 // Below threshold
        });

        await mathModule.checkForLevelUp();
        
        expect(mathModule.level).toBe(1);
    });

    test('should level down based on poor performance', async () => {
        mathModule.level = 2;
        
        metricsUtils.getAdaptabilityMetrics.mockResolvedValue({
            difficultyAdjustmentRecommendations: {
                shouldAdjustDifficulty: true,
                direction: 'decrease',
                reason: 'Low accuracy rate'
            }
        });

        await mathModule.updateAdaptiveDifficulty();
        
        expect(mathModule.level).toBe(1);
        expect(loggingUtils.logEvent).toHaveBeenCalledWith('levelDown', expect.any(Object));
    });

    test('should adjust exercise parameters based on performance', () => {
        const adaptabilityMetrics = {
            speedImprovement: [
                { exerciseType: 'addition_level1', improvement: 0.25 }
            ],
            accuracyImprovement: 0.15
        };

        mathModule.adjustExerciseParameters(adaptabilityMetrics);
        
        // Verify time limit adjustment
        expect(mathModule.exercises.addition_level1.timeLimit)
            .toBeLessThan(MATH_CONFIG.DIFFICULTY_LEVELS.BEGINNER.timeLimit);
        
        // Verify range adjustment
        expect(mathModule.exercises.addition_level1.range.max)
            .toBeGreaterThan(MATH_CONFIG.DIFFICULTY_LEVELS.BEGINNER.range.max);
    });

    test('should handle metrics errors gracefully', async () => {
        metricsUtils.getSessionEngagementMetrics.mockRejectedValue(new Error('Metrics error'));
        
        // Should not throw error
        await expect(mathModule.updateSessionMetrics()).resolves.not.toThrow();
        
        // Should still update UI
        const progressContainer = document.querySelector('.progress-container');
        expect(progressContainer).toBeTruthy();
    });

    test('should generate random numbers within range', () => {
        const min = 0;
        const max = 10;
        const number = mathModule.getRandomNumber(min, max);
        expect(number).toBeGreaterThanOrEqual(min);
        expect(number).toBeLessThanOrEqual(max);
    });

    test('should generate correct number of unique options', () => {
        const correct = 5;
        const range = { min: 0, max: 10 };
        const options = mathModule.generateOptions(correct, range);
        
        expect(options.length).toBe(4);
        expect(options).toContain(correct);
        expect(new Set(options).size).toBe(4); // All options should be unique
    });

    test('should correctly check addition answers', () => {
        const num1 = 5;
        const num2 = 3;
        const operation = '+';
        
        // Test correct answer
        mathModule.checkAnswer(num1, num2, operation, 8);
        expect(mathModule.score).toBe(1);

        // Test incorrect answer
        mathModule.checkAnswer(num1, num2, operation, 7);
        expect(mathModule.score).toBe(1);
    });

    test('should correctly check subtraction answers', () => {
        const num1 = 8;
        const num2 = 3;
        const operation = '-';
        
        // Test correct answer
        mathModule.checkAnswer(num1, num2, operation, 5);
        expect(mathModule.score).toBe(1);

        // Test incorrect answer
        mathModule.checkAnswer(num1, num2, operation, 4);
        expect(mathModule.score).toBe(1);
    });

    test('should level up after 5 correct answers', () => {
        const num1 = 1;
        const num2 = 1;
        const operation = '+';
        
        // Get 5 correct answers
        for (let i = 0; i < 5; i++) {
            mathModule.checkAnswer(num1, num2, operation, 2);
        }
        
        expect(mathModule.level).toBe(2);
        expect(mathModule.exercises.addition_level1.range.max).toBeGreaterThan(10);
    });

    test('should correctly check number recognition', () => {
        const correct = 42;
        
        // Test correct answer
        mathModule.checkNumberRecognition(correct, 42);
        expect(mathModule.score).toBe(1);

        // Test incorrect answer
        mathModule.checkNumberRecognition(correct, 24);
        expect(mathModule.score).toBe(1);
    });

    test('should update number line value', () => {
        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'number-line-value';
        document.body.appendChild(valueDisplay);

        mathModule.updateNumberLineValue(10);
        expect(valueDisplay.textContent).toBe('10');
    });

    test('should toggle counting blocks', () => {
        const block = document.createElement('div');
        block.className = 'counting-block';
        
        mathModule.toggleBlock(block);
        expect(block.classList.contains('active')).toBe(true);
        
        mathModule.toggleBlock(block);
        expect(block.classList.contains('active')).toBe(false);
    });
}); 