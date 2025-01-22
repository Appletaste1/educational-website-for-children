import { metricsUtils } from '../utils/metrics-utils.js';
import { loggingUtils } from '../utils/logging-utils.js';

// Mock loggingUtils
jest.mock('../utils/logging-utils.js', () => ({
    loggingUtils: {
        getLogsBySession: jest.fn(),
        getLogsByTimeRange: jest.fn(),
        getLogsByType: jest.fn()
    }
}));

describe('MetricsUtils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        metricsUtils.clearMetricsCache();
    });

    // Test Data Generators
    const generateAnswerLog = (exerciseType, num1, num2, operation, userAnswer, correctAnswer, timeTaken, isCorrect, timestamp) => ({
        eventType: 'answer',
        timestamp,
        data: {
            exerciseType,
            num1,
            num2,
            operation,
            userAnswer,
            correctAnswer,
            timeTaken,
            isCorrect
        }
    });

    const generateExerciseStartLog = (exerciseType, timestamp) => ({
        eventType: 'exerciseStart',
        timestamp,
        data: { exerciseType }
    });

    const generateLevelUpLog = (oldLevel, newLevel, totalScore, timestamp) => ({
        eventType: 'levelUp',
        timestamp,
        data: { oldLevel, newLevel, totalScore }
    });

    describe('Engagement Metrics', () => {
        test('should calculate session engagement metrics correctly', async () => {
            const mockLogs = [
                generateExerciseStartLog('addition_level1', 1000),
                generateAnswerLog('addition_level1', 5, 3, '+', 8, 8, 2.5, true, 2000),
                generateExerciseStartLog('subtraction_level1', 3000),
                generateAnswerLog('subtraction_level1', 8, 3, '-', 5, 5, 3.0, true, 4000)
            ];

            loggingUtils.getLogsBySession.mockResolvedValue(mockLogs);

            const metrics = await metricsUtils.getSessionEngagementMetrics('test_session');
            expect(metrics).toEqual({
                timeOnTask: 3,  // (4000 - 1000) / 1000
                tasksCompleted: 2,
                totalAttempts: 2,
                uniqueExerciseTypes: 2
            });
        });
    });

    describe('Performance Metrics', () => {
        test('should calculate performance metrics correctly', async () => {
            const mockLogs = [
                generateAnswerLog('addition_level1', 5, 3, '+', 7, 8, 2.0, false, 1000),
                generateAnswerLog('addition_level1', 5, 3, '+', 8, 8, 2.5, true, 2000),
                generateAnswerLog('addition_level1', 6, 4, '+', 10, 10, 1.5, true, 3000)
            ];

            loggingUtils.getLogsBySession.mockResolvedValue(mockLogs);

            const metrics = await metricsUtils.getPerformanceMetrics('test_session', 'addition_level1');
            expect(metrics).toEqual({
                attemptsBeforeCorrect: 2,  // First exercise took 2 attempts
                averageResponseTime: 2,    // Average of 2.5 and 1.5 for correct answers
                accuracyRate: 2/3,         // 2 correct out of 3 attempts
                streakData: {
                    currentStreak: 2,
                    maxStreak: 2,
                    totalStreaks: 1
                }
            });
        });

        test('should use cache for repeated calls', async () => {
            const mockLogs = [
                generateAnswerLog('addition_level1', 5, 3, '+', 8, 8, 2.0, true, 1000)
            ];

            loggingUtils.getLogsBySession.mockResolvedValue(mockLogs);

            await metricsUtils.getPerformanceMetrics('test_session', 'addition_level1');
            await metricsUtils.getPerformanceMetrics('test_session', 'addition_level1');

            expect(loggingUtils.getLogsBySession).toHaveBeenCalledTimes(1);
        });
    });

    describe('Progression Metrics', () => {
        test('should calculate progression metrics correctly', async () => {
            const mockLogs = [
                generateLevelUpLog(1, 2, 100, 1000),
                generateLevelUpLog(2, 3, 200, 2000),
                generateAnswerLog('addition_level1', 5, 3, '+', 8, 8, 2.0, true, 3000)
            ];

            loggingUtils.getLogsByTimeRange.mockResolvedValue(mockLogs);

            const metrics = await metricsUtils.getProgressionMetrics('user1', {
                start: 0,
                end: 5000
            });

            expect(metrics.levelsCompleted).toBe(2);
            expect(metrics.difficultyProgression).toHaveLength(2);
            expect(metrics.difficultyProgression[0]).toMatchObject({
                oldLevel: 1,
                newLevel: 2,
                totalScore: 100
            });
        });
    });

    describe('Error Analysis', () => {
        test('should identify error patterns correctly', async () => {
            const mockLogs = [
                // Operation confusion error
                generateAnswerLog('addition_level1', 5, 3, '+', 2, 8, 2.0, false, 1000),
                // Magnitude error
                generateAnswerLog('addition_level1', 5, 3, '+', 80, 8, 2.0, false, 2000),
                // Reversal error
                generateAnswerLog('addition_level1', 5, 3, '+', 80, 8, 2.0, false, 3000)
            ];

            loggingUtils.getLogsBySession.mockResolvedValue(mockLogs);

            const analysis = await metricsUtils.getErrorAnalysis('test_session', 'addition_level1');
            expect(analysis.errorPatterns.operationConfusion).toBeGreaterThan(0);
            expect(analysis.errorPatterns.magnitudeErrors).toBeGreaterThan(0);
            expect(analysis.commonErrors).toHaveLength(3);
        });

        test('should identify problem areas correctly', async () => {
            const mockLogs = [
                generateAnswerLog('addition_level1', 15, 7, '+', 21, 22, 2.0, false, 1000),
                generateAnswerLog('addition_level1', 15, 7, '+', 21, 22, 2.0, false, 2000)
            ];

            loggingUtils.getLogsBySession.mockResolvedValue(mockLogs);

            const analysis = await metricsUtils.getErrorAnalysis('test_session', 'addition_level1');
            const problemAreas = analysis.problemAreas;
            expect(problemAreas[0].area).toBe('Double-digit addition');
            expect(problemAreas[0].count).toBe(2);
        });
    });

    describe('Adaptability Metrics', () => {
        test('should calculate speed improvement correctly', async () => {
            const mockLogs = [
                generateAnswerLog('addition_level1', 5, 3, '+', 8, 8, 4.0, true, 1000),
                generateAnswerLog('addition_level1', 6, 4, '+', 10, 10, 2.0, true, 2000)
            ];

            loggingUtils.getLogsByType.mockResolvedValue(mockLogs);

            const metrics = await metricsUtils.getAdaptabilityMetrics('user1');
            const speedImprovements = metrics.speedImprovement;
            expect(speedImprovements).toHaveLength(1);
            expect(speedImprovements[0].improvement).toBeGreaterThan(0);
        });

        test('should generate appropriate difficulty recommendations', async () => {
            const mockLogs = Array(10).fill(null).map((_, i) => 
                generateAnswerLog('addition_level1', 5, 3, '+', 8, 8, 1.5, true, 1000 + i * 1000)
            );

            loggingUtils.getLogsByType.mockResolvedValue(mockLogs);

            const metrics = await metricsUtils.getAdaptabilityMetrics('user1');
            const recommendations = metrics.difficultyAdjustmentRecommendations;
            expect(recommendations.shouldAdjustDifficulty).toBe(true);
            expect(recommendations.direction).toBe('increase');
        });
    });
}); 