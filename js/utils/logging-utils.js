// Logging utility for math module performance tracking
import { MATH_CONFIG } from '../config/math-config.js';

class LoggingUtils {
    constructor() {
        this.logs = [];
        this.maxLogsBeforeSync = 100;
        this.syncInterval = MATH_CONFIG.PROGRESS.SAVE_INTERVAL;
        this.initializeStorage();
        this.startAutoSync();
    }

    initializeStorage() {
        // Initialize storage if not exists
        if (!localStorage.getItem('math_logs')) {
            localStorage.setItem('math_logs', JSON.stringify([]));
        }
    }

    startAutoSync() {
        // Automatically sync logs to storage based on configured interval
        setInterval(() => {
            this.syncToStorage();
        }, this.syncInterval);
    }

    logEvent(eventType, data) {
        const logEntry = {
            timestamp: Date.now(),
            eventType,
            data,
            sessionId: this.getSessionId()
        };

        console.debug(`[Math Module] ${eventType}:`, data);
        this.logs.push(logEntry);

        // Sync to storage if we've accumulated enough logs
        if (this.logs.length >= this.maxLogsBeforeSync) {
            this.syncToStorage();
        }
    }

    logAnswer(exerciseType, num1, num2, operation, userAnswer, correctAnswer, timeTaken) {
        this.logEvent('answer', {
            exerciseType,
            num1,
            num2,
            operation,
            userAnswer,
            correctAnswer,
            timeTaken,
            isCorrect: userAnswer === correctAnswer
        });
    }

    logLevelUp(oldLevel, newLevel, totalScore) {
        this.logEvent('levelUp', {
            oldLevel,
            newLevel,
            totalScore
        });
    }

    logAchievement(achievementId, timeTaken) {
        this.logEvent('achievement', {
            achievementId,
            timeTaken
        });
    }

    logExerciseStart(exerciseType, difficulty) {
        this.logEvent('exerciseStart', {
            exerciseType,
            difficulty
        });
    }

    logHintUsed(exerciseType, hintType) {
        this.logEvent('hint', {
            exerciseType,
            hintType
        });
    }

    logError(errorType, details) {
        this.logEvent('error', {
            errorType,
            details
        });
    }

    logInteraction(interactionType, details) {
        this.logEvent('interaction', {
            interactionType,
            details
        });
    }

    getSessionId() {
        if (!this._sessionId) {
            this._sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        return this._sessionId;
    }

    async syncToStorage() {
        try {
            // Get existing logs
            const existingLogs = JSON.parse(localStorage.getItem('math_logs') || '[]');
            
            // Append new logs
            const updatedLogs = [...existingLogs, ...this.logs];
            
            // Keep only last 1000 logs to prevent storage issues
            const trimmedLogs = updatedLogs.slice(-1000);
            
            // Save to storage
            localStorage.setItem('math_logs', JSON.stringify(trimmedLogs));
            
            // Clear in-memory logs after successful sync
            this.logs = [];
            
            console.debug('[Math Module] Logs synced to storage');
        } catch (error) {
            console.error('[Math Module] Error syncing logs:', error);
            // Keep logs in memory if sync fails
        }
    }

    getLogsByType(eventType, limit = 100) {
        const storedLogs = JSON.parse(localStorage.getItem('math_logs') || '[]');
        const filteredLogs = storedLogs.filter(log => log.eventType === eventType);
        return filteredLogs.slice(-limit);
    }

    getLogsByTimeRange(startTime, endTime) {
        const storedLogs = JSON.parse(localStorage.getItem('math_logs') || '[]');
        return storedLogs.filter(log => 
            log.timestamp >= startTime && log.timestamp <= endTime
        );
    }

    getLogsBySession(sessionId) {
        const storedLogs = JSON.parse(localStorage.getItem('math_logs') || '[]');
        return storedLogs.filter(log => log.sessionId === sessionId);
    }

    clearLogs() {
        this.logs = [];
        localStorage.setItem('math_logs', JSON.stringify([]));
        console.debug('[Math Module] Logs cleared');
    }
}

// Export singleton instance
export const loggingUtils = new LoggingUtils(); 