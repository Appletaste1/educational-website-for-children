import { visualizationUtils } from '../utils/visualization-utils.js';
import { metricsUtils } from '../utils/metrics-utils.js';
import { MATH_CONFIG } from '../config/math-config.js';

// Mock dependencies
jest.mock('../utils/metrics-utils.js');

describe('VisualizationUtils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        visualizationUtils.clearCache();

        // Mock metrics data
        metricsUtils.getSessionEngagementMetrics.mockResolvedValue({
            tasksCompleted: 10,
            uniqueExerciseTypes: 3,
            totalAttempts: 15
        });

        metricsUtils.getPerformanceMetrics.mockResolvedValue({
            accuracyRate: 0.8,
            averageResponseTime: 2.5,
            streakData: {
                currentStreak: 5,
                maxStreak: 8
            }
        });

        metricsUtils.getProgressionMetrics.mockResolvedValue({
            difficultyProgression: [
                { timestamp: Date.now() - 3000, level: 1 },
                { timestamp: Date.now() - 2000, level: 2 },
                { timestamp: Date.now() - 1000, level: 3 }
            ]
        });

        metricsUtils.getErrorAnalysis.mockResolvedValue({
            errorPatterns: {
                operationConfusion: 3,
                magnitudeErrors: 2,
                reversalErrors: 1,
                carryBorrowErrors: 4
            },
            problemAreas: [
                { area: 'Double-digit addition', count: 3 },
                { area: 'Single-digit subtraction', count: 2 }
            ]
        });

        metricsUtils.getAdaptabilityMetrics.mockResolvedValue({
            accuracyImprovement: 0.15,
            speedImprovement: [
                { exerciseType: 'addition_level1', improvement: 0.2 }
            ]
        });
    });

    describe('Achievement Chart Data', () => {
        test('should generate correct achievement chart data', async () => {
            const data = await visualizationUtils.getAchievementChartData('test_session');
            
            expect(data.labels).toEqual(['Tasks Completed', 'Unique Exercises', 'Total Attempts']);
            expect(data.datasets[0].data).toEqual([10, 3, 15]);
            expect(data.datasets[0].backgroundColor).toHaveLength(3);
        });

        test('should use cached data for repeated calls', async () => {
            await visualizationUtils.getAchievementChartData('test_session');
            await visualizationUtils.getAchievementChartData('test_session');
            
            expect(metricsUtils.getSessionEngagementMetrics).toHaveBeenCalledTimes(1);
        });
    });

    describe('Performance Line Data', () => {
        test('should generate correct performance line data', async () => {
            const data = await visualizationUtils.getPerformanceLineData('test_session', 'last_hour');
            
            expect(data.datasets).toHaveLength(2);
            expect(data.datasets[0].label).toBe('Accuracy Rate');
            expect(data.datasets[1].label).toBe('Response Time');
            expect(data.datasets[0].data[0]).toBe(80); // 0.8 * 100
            expect(data.datasets[1].data[0]).toBe(2.5);
        });

        test('should format timestamps correctly', async () => {
            const data = await visualizationUtils.getPerformanceLineData('test_session', 'last_hour');
            
            expect(data.labels).toHaveLength(3);
            data.labels.forEach(label => {
                expect(typeof label).toBe('string');
                expect(label).toMatch(/\d{1,2}:\d{2}:\d{2}/); // Time format
            });
        });
    });

    describe('Error Distribution Data', () => {
        test('should generate correct error distribution data', async () => {
            const data = await visualizationUtils.getErrorDistributionData('test_session');
            
            expect(data.labels).toHaveLength(4);
            expect(data.datasets[0].data).toEqual([3, 2, 1, 4]);
            expect(data.datasets[0].backgroundColor).toHaveLength(4);
        });

        test('should maintain consistent label order', async () => {
            const data1 = await visualizationUtils.getErrorDistributionData('test_session');
            const data2 = await visualizationUtils.getErrorDistributionData('test_session');
            
            expect(data1.labels).toEqual(data2.labels);
        });
    });

    describe('Learning Heatmap Data', () => {
        test('should generate correct heatmap structure', async () => {
            const data = await visualizationUtils.getLearningHeatmapData('test_session');
            
            expect(data.exercises).toHaveLength(3);
            expect(data.difficulties).toHaveLength(3);
            expect(data.values).toHaveLength(9);
        });

        test('should populate values based on problem areas', async () => {
            const data = await visualizationUtils.getLearningHeatmapData('test_session');
            
            expect(Math.max(...data.values)).toBeGreaterThan(0);
            expect(data.exercises).toContain('Addition');
            expect(data.exercises).toContain('Subtraction');
        });
    });

    describe('Progress Meter Configuration', () => {
        test('should generate correct progress meter config', async () => {
            const config = await visualizationUtils.getProgressMeterConfig('test_session');
            
            expect(config.accuracy.value).toBe(80); // 0.8 * 100
            expect(config.improvement.value).toBe(15); // 0.15 * 100
            expect(config.speed.value).toBeLessThanOrEqual(100);
        });

        test('should assign appropriate colors based on values', async () => {
            const config = await visualizationUtils.getProgressMeterConfig('test_session');
            
            expect(config.accuracy.color).toBe(visualizationUtils.colorPalette.success);
            expect(config.accuracy.threshold).toBe(
                MATH_CONFIG.PROGRESS.AUTO_LEVEL_UP_THRESHOLD * 100
            );
        });
    });

    describe('Achievement Animation Configuration', () => {
        test('should provide correct animation config for different achievements', () => {
            const quickLearnerConfig = visualizationUtils.getAchievementAnimationConfig('quick_learner');
            const perfectScoreConfig = visualizationUtils.getAchievementAnimationConfig('perfect_score');
            const mathMasterConfig = visualizationUtils.getAchievementAnimationConfig('math_master');
            
            expect(quickLearnerConfig.icon).toBe('⚡');
            expect(perfectScoreConfig.icon).toBe('🌟');
            expect(mathMasterConfig.icon).toBe('👑');
            
            expect(quickLearnerConfig.particleCount).toBeLessThan(perfectScoreConfig.particleCount);
            expect(perfectScoreConfig.particleCount).toBeLessThan(mathMasterConfig.particleCount);
        });

        test('should provide fallback config for unknown achievement types', () => {
            const config = visualizationUtils.getAchievementAnimationConfig('unknown');
            
            expect(config.duration).toBe(MATH_CONFIG.ANIMATIONS.FEEDBACK_DURATION);
            expect(config.particles).toBe(true);
        });
    });

    describe('Chart Configurations', () => {
        test('should provide appropriate configurations for different chart types', () => {
            const barConfig = visualizationUtils.getChartConfig('bar');
            const lineConfig = visualizationUtils.getChartConfig('line');
            const pieConfig = visualizationUtils.getChartConfig('pie');
            const heatmapConfig = visualizationUtils.getChartConfig('heatmap');
            
            expect(barConfig.scales.y.beginAtZero).toBe(true);
            expect(lineConfig.elements.line.tension).toBe(0.4);
            expect(pieConfig.plugins.legend.position).toBe('right');
            expect(heatmapConfig.plugins.legend.display).toBe(false);
        });

        test('should cache and reuse chart configurations', () => {
            const config1 = visualizationUtils.getChartConfig('bar');
            const config2 = visualizationUtils.getChartConfig('bar');
            
            expect(config1).toBe(config2);
        });
    });

    describe('Utility Methods', () => {
        test('should determine correct colors based on values', () => {
            expect(visualizationUtils.getColorForValue(85)).toBe(visualizationUtils.colorPalette.success);
            expect(visualizationUtils.getColorForValue(65)).toBe(visualizationUtils.colorPalette.warning);
            expect(visualizationUtils.getColorForValue(45)).toBe(visualizationUtils.colorPalette.error);
        });

        test('should handle inverse color mapping', () => {
            expect(visualizationUtils.getColorForValue(85, true)).toBe(visualizationUtils.colorPalette.error);
            expect(visualizationUtils.getColorForValue(35, true)).toBe(visualizationUtils.colorPalette.success);
        });

        test('should manage cache correctly', () => {
            const testData = { test: 'data' };
            visualizationUtils.cacheData('test_key', testData);
            
            expect(visualizationUtils.isCacheValid('test_key')).toBe(true);
            expect(visualizationUtils.isCacheValid('invalid_key')).toBe(false);
            
            visualizationUtils.clearCache();
            expect(visualizationUtils.isCacheValid('test_key')).toBe(false);
        });
    });
}); 