import { metricsUtils } from './metrics-utils.js';
import { MATH_CONFIG } from '../config/math-config.js';

class VisualizationUtils {
    constructor() {
        this.chartConfigs = new Map();
        this.dataCache = new Map();
        this.cacheTimeout = 30000; // 30 seconds cache timeout
        this.colorPalette = {
            primary: ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#F44336'],
            success: '#4CAF50',
            warning: '#FF9800',
            error: '#F44336',
            neutral: '#9E9E9E'
        };
    }

    // Achievement Progress Bar Chart
    async getAchievementChartData(sessionId) {
        const cacheKey = `achievement_${sessionId}`;
        if (this.isCacheValid(cacheKey)) {
            return this.dataCache.get(cacheKey);
        }

        const metrics = await metricsUtils.getSessionEngagementMetrics(sessionId);
        const data = {
            labels: ['Tasks Completed', 'Unique Exercises', 'Total Attempts'],
            datasets: [{
                data: [
                    metrics.tasksCompleted,
                    metrics.uniqueExerciseTypes,
                    metrics.totalAttempts
                ],
                backgroundColor: this.colorPalette.primary.slice(0, 3),
                borderWidth: 1
            }]
        };

        this.cacheData(cacheKey, data);
        return data;
    }

    // Performance Line Graph
    async getPerformanceLineData(sessionId, timeRange) {
        const cacheKey = `performance_${sessionId}_${timeRange}`;
        if (this.isCacheValid(cacheKey)) {
            return this.dataCache.get(cacheKey);
        }

        const performanceMetrics = await metricsUtils.getPerformanceMetrics(sessionId);
        const progressionMetrics = await metricsUtils.getProgressionMetrics(sessionId, timeRange);

        const data = {
            labels: progressionMetrics.difficultyProgression.map(p => 
                new Date(p.timestamp).toLocaleTimeString()
            ),
            datasets: [
                {
                    label: 'Accuracy Rate',
                    data: [performanceMetrics.accuracyRate * 100],
                    borderColor: this.colorPalette.success,
                    fill: false
                },
                {
                    label: 'Response Time',
                    data: [performanceMetrics.averageResponseTime],
                    borderColor: this.colorPalette.warning,
                    fill: false
                }
            ]
        };

        this.cacheData(cacheKey, data);
        return data;
    }

    // Error Distribution Pie Chart
    async getErrorDistributionData(sessionId) {
        const cacheKey = `errors_${sessionId}`;
        if (this.isCacheValid(cacheKey)) {
            return this.dataCache.get(cacheKey);
        }

        const errorAnalysis = await metricsUtils.getErrorAnalysis(sessionId);
        const { errorPatterns } = errorAnalysis;

        const data = {
            labels: [
                'Operation Confusion',
                'Magnitude Errors',
                'Reversal Errors',
                'Carry/Borrow Errors'
            ],
            datasets: [{
                data: [
                    errorPatterns.operationConfusion,
                    errorPatterns.magnitudeErrors,
                    errorPatterns.reversalErrors,
                    errorPatterns.carryBorrowErrors
                ],
                backgroundColor: this.colorPalette.primary,
                borderWidth: 1
            }]
        };

        this.cacheData(cacheKey, data);
        return data;
    }

    // Learning Progress Heatmap
    async getLearningHeatmapData(sessionId) {
        const cacheKey = `heatmap_${sessionId}`;
        if (this.isCacheValid(cacheKey)) {
            return this.dataCache.get(cacheKey);
        }

        const performanceMetrics = await metricsUtils.getPerformanceMetrics(sessionId);
        const errorAnalysis = await metricsUtils.getErrorAnalysis(sessionId);

        // Create activity density matrix
        const data = {
            exercises: ['Addition', 'Subtraction', 'Number Recognition'],
            difficulties: ['Beginner', 'Intermediate', 'Advanced'],
            values: Array(9).fill(0) // 3x3 matrix
        };

        // Populate with actual data (example logic)
        errorAnalysis.problemAreas.forEach(area => {
            const exerciseIndex = data.exercises.findIndex(ex => 
                area.area.toLowerCase().includes(ex.toLowerCase())
            );
            if (exerciseIndex >= 0) {
                data.values[exerciseIndex] = area.count;
            }
        });

        this.cacheData(cacheKey, data);
        return data;
    }

    // Progress Meter Configuration
    async getProgressMeterConfig(sessionId) {
        const performanceMetrics = await metricsUtils.getPerformanceMetrics(sessionId);
        const adaptabilityMetrics = await metricsUtils.getAdaptabilityMetrics(sessionId);

        return {
            accuracy: {
                value: performanceMetrics.accuracyRate * 100,
                color: this.getColorForValue(performanceMetrics.accuracyRate * 100),
                threshold: MATH_CONFIG.PROGRESS.AUTO_LEVEL_UP_THRESHOLD * 100
            },
            speed: {
                value: Math.min(100, (performanceMetrics.averageResponseTime / 
                    MATH_CONFIG.DIFFICULTY_LEVELS.BEGINNER.timeLimit) * 100),
                color: this.getColorForValue(performanceMetrics.averageResponseTime, true),
                threshold: 50
            },
            improvement: {
                value: Math.max(0, adaptabilityMetrics.accuracyImprovement * 100),
                color: this.getColorForValue(adaptabilityMetrics.accuracyImprovement * 100),
                threshold: 20
            }
        };
    }

    // Achievement Celebration Animation Config
    getAchievementAnimationConfig(achievementType) {
        const baseConfig = {
            duration: MATH_CONFIG.ANIMATIONS.FEEDBACK_DURATION,
            easing: 'ease-out',
            particles: true
        };

        switch (achievementType) {
            case 'quick_learner':
                return {
                    ...baseConfig,
                    icon: '⚡',
                    color: '#FFD700',
                    particleCount: 20
                };
            case 'perfect_score':
                return {
                    ...baseConfig,
                    icon: '🌟',
                    color: '#FFA500',
                    particleCount: 30
                };
            case 'math_master':
                return {
                    ...baseConfig,
                    icon: '👑',
                    color: '#FF4500',
                    particleCount: 50
                };
            default:
                return baseConfig;
        }
    }

    // Chart Configurations
    getChartConfig(chartType) {
        if (this.chartConfigs.has(chartType)) {
            return this.chartConfigs.get(chartType);
        }

        const config = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false
                }
            }
        };

        switch (chartType) {
            case 'bar':
                config.scales = {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: false
                        }
                    }
                };
                break;
            case 'line':
                config.elements = {
                    line: {
                        tension: 0.4
                    },
                    point: {
                        radius: 4,
                        hitRadius: 10,
                        hoverRadius: 6
                    }
                };
                break;
            case 'pie':
                config.plugins.legend.position = 'right';
                break;
            case 'heatmap':
                config.plugins.legend.display = false;
                config.scales = {
                    x: {
                        type: 'category',
                        position: 'bottom'
                    },
                    y: {
                        type: 'category',
                        position: 'left'
                    }
                };
                break;
        }

        this.chartConfigs.set(chartType, config);
        return config;
    }

    // Utility Methods
    getColorForValue(value, isInverse = false) {
        const normalizedValue = isInverse ? 100 - value : value;
        if (normalizedValue >= 80) return this.colorPalette.success;
        if (normalizedValue >= 60) return this.colorPalette.warning;
        return this.colorPalette.error;
    }

    isCacheValid(key) {
        if (!this.dataCache.has(key)) return false;
        const cached = this.dataCache.get(key);
        return Date.now() - cached.timestamp < this.cacheTimeout;
    }

    cacheData(key, data) {
        this.dataCache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.dataCache.clear();
    }
}

// Export singleton instance
export const visualizationUtils = new VisualizationUtils(); 