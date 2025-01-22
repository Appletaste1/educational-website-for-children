import { loggingUtils } from './logging-utils.js';
import { MATH_CONFIG } from '../config/math-config.js';

class MetricsUtils {
    constructor() {
        this.metricsCache = new Map();
        this.cacheTimeout = 60000; // 1 minute cache timeout
    }

    // Engagement Metrics

    async getSessionEngagementMetrics(sessionId) {
        const logs = loggingUtils.getLogsBySession(sessionId);
        const exerciseStartLogs = logs.filter(log => log.eventType === 'exerciseStart');
        const answerLogs = logs.filter(log => log.eventType === 'answer');

        return {
            timeOnTask: this.calculateTimeOnTask(logs),
            tasksCompleted: answerLogs.filter(log => log.data.isCorrect).length,
            totalAttempts: answerLogs.length,
            uniqueExerciseTypes: new Set(exerciseStartLogs.map(log => log.data.exerciseType)).size
        };
    }

    calculateTimeOnTask(logs) {
        if (logs.length < 2) return 0;
        const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp);
        return (sortedLogs[sortedLogs.length - 1].timestamp - sortedLogs[0].timestamp) / 1000;
    }

    // Performance Metrics

    async getPerformanceMetrics(sessionId, exerciseType) {
        const cacheKey = `performance_${sessionId}_${exerciseType}`;
        if (this.metricsCache.has(cacheKey)) {
            const cached = this.metricsCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        const logs = loggingUtils.getLogsBySession(sessionId);
        const answerLogs = logs.filter(log => 
            log.eventType === 'answer' && 
            (!exerciseType || log.data.exerciseType === exerciseType)
        );

        const metrics = {
            attemptsBeforeCorrect: this.calculateAverageAttemptsBeforeCorrect(answerLogs),
            averageResponseTime: this.calculateAverageResponseTime(answerLogs),
            accuracyRate: this.calculateAccuracyRate(answerLogs),
            streakData: this.calculateStreakData(answerLogs)
        };

        this.metricsCache.set(cacheKey, {
            timestamp: Date.now(),
            data: metrics
        });

        return metrics;
    }

    calculateAverageAttemptsBeforeCorrect(answerLogs) {
        const exerciseAttempts = new Map();
        let totalAttempts = 0;
        let completedExercises = 0;

        for (const log of answerLogs) {
            const exerciseKey = `${log.data.exerciseType}_${log.data.num1}_${log.data.operation}_${log.data.num2}`;
            
            if (!exerciseAttempts.has(exerciseKey)) {
                exerciseAttempts.set(exerciseKey, 0);
            }
            
            exerciseAttempts.set(exerciseKey, exerciseAttempts.get(exerciseKey) + 1);
            
            if (log.data.isCorrect) {
                totalAttempts += exerciseAttempts.get(exerciseKey);
                completedExercises++;
                exerciseAttempts.delete(exerciseKey);
            }
        }

        return completedExercises > 0 ? totalAttempts / completedExercises : 0;
    }

    calculateAverageResponseTime(answerLogs) {
        const correctAnswers = answerLogs.filter(log => log.data.isCorrect);
        if (correctAnswers.length === 0) return 0;

        const totalTime = correctAnswers.reduce((sum, log) => sum + log.data.timeTaken, 0);
        return totalTime / correctAnswers.length;
    }

    calculateAccuracyRate(answerLogs) {
        if (answerLogs.length === 0) return 0;
        const correctAnswers = answerLogs.filter(log => log.data.isCorrect);
        return correctAnswers.length / answerLogs.length;
    }

    calculateStreakData(answerLogs) {
        let currentStreak = 0;
        let maxStreak = 0;
        let totalStreaks = 0;

        for (const log of answerLogs) {
            if (log.data.isCorrect) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                if (currentStreak > 0) {
                    totalStreaks++;
                }
                currentStreak = 0;
            }
        }

        return {
            currentStreak,
            maxStreak,
            totalStreaks
        };
    }

    // Progression Metrics

    async getProgressionMetrics(userId, timeRange) {
        const logs = timeRange ? 
            loggingUtils.getLogsByTimeRange(timeRange.start, timeRange.end) :
            loggingUtils.getLogsByType('levelUp');

        return {
            levelsCompleted: this.calculateLevelsCompleted(logs),
            difficultyProgression: this.calculateDifficultyProgression(logs),
            learningRate: this.calculateLearningRate(logs),
            moduleCompletionTimes: this.calculateModuleCompletionTimes(logs)
        };
    }

    calculateLevelsCompleted(logs) {
        const levelUpLogs = logs.filter(log => log.eventType === 'levelUp');
        return levelUpLogs.length;
    }

    calculateDifficultyProgression(logs) {
        const levelUpLogs = logs.filter(log => log.eventType === 'levelUp');
        return levelUpLogs.map(log => ({
            timestamp: log.timestamp,
            oldLevel: log.data.oldLevel,
            newLevel: log.data.newLevel,
            totalScore: log.data.totalScore
        }));
    }

    calculateLearningRate(logs) {
        const answerLogs = logs.filter(log => log.eventType === 'answer');
        if (answerLogs.length < 2) return 0;

        // Group answers by time periods (e.g., daily)
        const dailyAccuracy = new Map();
        for (const log of answerLogs) {
            const day = new Date(log.timestamp).toDateString();
            if (!dailyAccuracy.has(day)) {
                dailyAccuracy.set(day, { correct: 0, total: 0 });
            }
            const stats = dailyAccuracy.get(day);
            stats.total++;
            if (log.data.isCorrect) stats.correct++;
        }

        // Calculate rate of improvement
        const accuracyTrend = Array.from(dailyAccuracy.values())
            .map(stats => stats.correct / stats.total);
        
        if (accuracyTrend.length < 2) return 0;
        
        // Simple linear regression slope
        const xMean = (accuracyTrend.length - 1) / 2;
        const yMean = accuracyTrend.reduce((a, b) => a + b) / accuracyTrend.length;
        
        let numerator = 0;
        let denominator = 0;
        
        accuracyTrend.forEach((y, x) => {
            numerator += (x - xMean) * (y - yMean);
            denominator += Math.pow(x - xMean, 2);
        });
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    calculateModuleCompletionTimes(logs) {
        const moduleCompletions = new Map();
        const answerLogs = logs.filter(log => log.eventType === 'answer');

        for (const log of answerLogs) {
            const { exerciseType } = log.data;
            if (!moduleCompletions.has(exerciseType)) {
                moduleCompletions.set(exerciseType, []);
            }
            moduleCompletions.get(exerciseType).push(log.data.timeTaken);
        }

        return Array.from(moduleCompletions.entries()).map(([module, times]) => ({
            module,
            averageTime: times.reduce((a, b) => a + b) / times.length,
            minTime: Math.min(...times),
            maxTime: Math.max(...times)
        }));
    }

    // Error Analysis

    async getErrorAnalysis(sessionId, exerciseType) {
        const logs = loggingUtils.getLogsBySession(sessionId);
        const incorrectAnswerLogs = logs.filter(log => 
            log.eventType === 'answer' && 
            !log.data.isCorrect &&
            (!exerciseType || log.data.exerciseType === exerciseType)
        );

        return {
            commonErrors: this.analyzeCommonErrors(incorrectAnswerLogs),
            errorPatterns: this.identifyErrorPatterns(incorrectAnswerLogs),
            problemAreas: this.identifyProblemAreas(incorrectAnswerLogs)
        };
    }

    analyzeCommonErrors(incorrectAnswerLogs) {
        const errorCounts = new Map();
        
        for (const log of incorrectAnswerLogs) {
            const { num1, num2, operation, userAnswer, correctAnswer } = log.data;
            const errorKey = `${num1}${operation}${num2}=${userAnswer}`;
            
            if (!errorCounts.has(errorKey)) {
                errorCounts.set(errorKey, {
                    count: 0,
                    details: { num1, num2, operation, userAnswer, correctAnswer }
                });
            }
            
            errorCounts.get(errorKey).count++;
        }

        return Array.from(errorCounts.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5)
            .map(([key, value]) => ({
                error: key,
                count: value.count,
                details: value.details
            }));
    }

    identifyErrorPatterns(incorrectAnswerLogs) {
        const patterns = {
            operationConfusion: 0,
            magnitudeErrors: 0,
            reversalErrors: 0,
            carryBorrowErrors: 0
        };

        for (const log of incorrectAnswerLogs) {
            const { num1, num2, operation, userAnswer, correctAnswer } = log.data;

            // Operation confusion (e.g., adding when should subtract)
            if (operation === '+' && userAnswer === num1 - num2 ||
                operation === '-' && userAnswer === num1 + num2) {
                patterns.operationConfusion++;
            }

            // Magnitude errors (answer off by factor of 10)
            if (Math.abs(Math.log10(userAnswer) - Math.log10(correctAnswer)) >= 1) {
                patterns.magnitudeErrors++;
            }

            // Reversal errors (e.g., 21 instead of 12)
            if (userAnswer.toString().split('').reverse().join('') === correctAnswer.toString()) {
                patterns.reversalErrors++;
            }

            // Carry/borrow errors (common in addition/subtraction)
            if (operation === '+' && 
                Math.abs(userAnswer - correctAnswer) === 10 ||
                operation === '-' && 
                Math.abs(userAnswer - correctAnswer) === 10) {
                patterns.carryBorrowErrors++;
            }
        }

        return patterns;
    }

    identifyProblemAreas(incorrectAnswerLogs) {
        const problemAreas = new Map();

        for (const log of incorrectAnswerLogs) {
            const { exerciseType, num1, num2 } = log.data;
            
            // Categorize problem areas
            if (exerciseType.includes('addition')) {
                if (num1 >= 10 || num2 >= 10) {
                    this.incrementProblemArea(problemAreas, 'Double-digit addition');
                } else {
                    this.incrementProblemArea(problemAreas, 'Single-digit addition');
                }
            } else if (exerciseType.includes('subtraction')) {
                if (num1 >= 10) {
                    this.incrementProblemArea(problemAreas, 'Double-digit subtraction');
                } else {
                    this.incrementProblemArea(problemAreas, 'Single-digit subtraction');
                }
            }
        }

        return Array.from(problemAreas.entries())
            .map(([area, count]) => ({ area, count }))
            .sort((a, b) => b.count - a.count);
    }

    incrementProblemArea(map, area) {
        map.set(area, (map.get(area) || 0) + 1);
    }

    // Adaptability Indicators

    async getAdaptabilityMetrics(userId, timeRange) {
        const logs = timeRange ?
            loggingUtils.getLogsByTimeRange(timeRange.start, timeRange.end) :
            loggingUtils.getLogsByType('answer');

        return {
            speedImprovement: this.calculateSpeedImprovement(logs),
            accuracyImprovement: this.calculateAccuracyImprovement(logs),
            difficultyAdjustmentRecommendations: this.generateDifficultyRecommendations(logs)
        };
    }

    calculateSpeedImprovement(logs) {
        const answerLogs = logs.filter(log => log.eventType === 'answer' && log.data.isCorrect);
        if (answerLogs.length < 2) return 0;

        // Group by exercise type and calculate average time trends
        const exerciseTimeTrends = new Map();
        
        for (const log of answerLogs) {
            const { exerciseType, timeTaken } = log.data;
            if (!exerciseTimeTrends.has(exerciseType)) {
                exerciseTimeTrends.set(exerciseType, []);
            }
            exerciseTimeTrends.get(exerciseType).push({
                timestamp: log.timestamp,
                time: timeTaken
            });
        }

        // Calculate improvement rate for each exercise type
        const improvements = [];
        for (const [type, times] of exerciseTimeTrends.entries()) {
            if (times.length < 2) continue;

            times.sort((a, b) => a.timestamp - b.timestamp);
            const firstAvg = times.slice(0, Math.ceil(times.length / 2))
                .reduce((sum, t) => sum + t.time, 0) / Math.ceil(times.length / 2);
            const secondAvg = times.slice(Math.ceil(times.length / 2))
                .reduce((sum, t) => sum + t.time, 0) / Math.floor(times.length / 2);

            improvements.push({
                exerciseType: type,
                improvement: (firstAvg - secondAvg) / firstAvg
            });
        }

        return improvements;
    }

    calculateAccuracyImprovement(logs) {
        const answerLogs = logs.filter(log => log.eventType === 'answer');
        if (answerLogs.length < 2) return 0;

        // Group answers into time windows
        const windowSize = 10; // Number of answers per window
        const windows = [];
        
        for (let i = 0; i < answerLogs.length; i += windowSize) {
            const windowLogs = answerLogs.slice(i, i + windowSize);
            const accuracy = windowLogs.filter(log => log.data.isCorrect).length / windowLogs.length;
            windows.push(accuracy);
        }

        // Calculate trend
        if (windows.length < 2) return 0;
        
        const firstHalf = windows.slice(0, Math.ceil(windows.length / 2));
        const secondHalf = windows.slice(Math.ceil(windows.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b) / secondHalf.length;
        
        return (secondAvg - firstAvg) / firstAvg;
    }

    generateDifficultyRecommendations(logs) {
        const answerLogs = logs.filter(log => log.eventType === 'answer');
        if (answerLogs.length < 10) return null;

        const recentLogs = answerLogs.slice(-10);
        const recentAccuracy = recentLogs.filter(log => log.data.isCorrect).length / recentLogs.length;
        const averageTime = recentLogs.reduce((sum, log) => sum + log.data.timeTaken, 0) / recentLogs.length;

        const recommendations = {
            shouldAdjustDifficulty: false,
            direction: null,
            reason: null
        };

        const { AUTO_LEVEL_UP_THRESHOLD } = MATH_CONFIG.PROGRESS;
        const currentDifficulty = recentLogs[0].data.exerciseType;

        if (recentAccuracy > AUTO_LEVEL_UP_THRESHOLD && averageTime < MATH_CONFIG.DIFFICULTY_LEVELS[currentDifficulty].timeLimit / 2) {
            recommendations.shouldAdjustDifficulty = true;
            recommendations.direction = 'increase';
            recommendations.reason = 'High accuracy and quick responses';
        } else if (recentAccuracy < 0.3) {
            recommendations.shouldAdjustDifficulty = true;
            recommendations.direction = 'decrease';
            recommendations.reason = 'Low accuracy rate';
        }

        return recommendations;
    }

    // Utility Methods

    clearMetricsCache() {
        this.metricsCache.clear();
    }
}

// Export singleton instance
export const metricsUtils = new MetricsUtils(); 