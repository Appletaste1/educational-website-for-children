import { loggingUtils } from '../utils/logging-utils.js';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key]),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

describe('LoggingUtils', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
        loggingUtils.clearLogs();
    });

    test('should initialize storage on construction', () => {
        expect(localStorage.getItem('math_logs')).toBe('[]');
    });

    test('should log events with correct structure', () => {
        const eventType = 'test_event';
        const eventData = { test: 'data' };
        
        loggingUtils.logEvent(eventType, eventData);
        
        const logs = loggingUtils.logs;
        expect(logs).toHaveLength(1);
        expect(logs[0]).toMatchObject({
            eventType,
            data: eventData,
            sessionId: expect.any(String),
            timestamp: expect.any(Number)
        });
    });

    test('should log answers correctly', () => {
        loggingUtils.logAnswer(
            'addition_level1',
            5,
            3,
            '+',
            8,
            8,
            2.5
        );

        const logs = loggingUtils.logs;
        expect(logs).toHaveLength(1);
        expect(logs[0].eventType).toBe('answer');
        expect(logs[0].data).toMatchObject({
            exerciseType: 'addition_level1',
            num1: 5,
            num2: 3,
            operation: '+',
            userAnswer: 8,
            correctAnswer: 8,
            timeTaken: 2.5,
            isCorrect: true
        });
    });

    test('should log level up events', () => {
        loggingUtils.logLevelUp(1, 2, 100);

        const logs = loggingUtils.logs;
        expect(logs).toHaveLength(1);
        expect(logs[0].eventType).toBe('levelUp');
        expect(logs[0].data).toMatchObject({
            oldLevel: 1,
            newLevel: 2,
            totalScore: 100
        });
    });

    test('should log achievements', () => {
        loggingUtils.logAchievement('quick_learner', 25.5);

        const logs = loggingUtils.logs;
        expect(logs).toHaveLength(1);
        expect(logs[0].eventType).toBe('achievement');
        expect(logs[0].data).toMatchObject({
            achievementId: 'quick_learner',
            timeTaken: 25.5
        });
    });

    test('should log exercise starts', () => {
        loggingUtils.logExerciseStart('addition_level1', 'BEGINNER');

        const logs = loggingUtils.logs;
        expect(logs).toHaveLength(1);
        expect(logs[0].eventType).toBe('exerciseStart');
        expect(logs[0].data).toMatchObject({
            exerciseType: 'addition_level1',
            difficulty: 'BEGINNER'
        });
    });

    test('should sync logs to storage when max logs reached', () => {
        // Fill up to maxLogsBeforeSync
        for (let i = 0; i < loggingUtils.maxLogsBeforeSync; i++) {
            loggingUtils.logEvent('test', { count: i });
        }

        expect(localStorage.setItem).toHaveBeenCalled();
        expect(JSON.parse(localStorage.getItem('math_logs'))).toHaveLength(loggingUtils.maxLogsBeforeSync);
        expect(loggingUtils.logs).toHaveLength(0); // Should be cleared after sync
    });

    test('should retrieve logs by type', () => {
        loggingUtils.logAnswer('addition_level1', 1, 1, '+', 2, 2, 1.5);
        loggingUtils.logLevelUp(1, 2, 100);
        loggingUtils.logAnswer('addition_level1', 2, 2, '+', 4, 4, 2.0);

        const answerLogs = loggingUtils.getLogsByType('answer');
        expect(answerLogs).toHaveLength(2);
        expect(answerLogs[0].data.num1).toBe(1);
        expect(answerLogs[1].data.num1).toBe(2);
    });

    test('should retrieve logs by time range', () => {
        const startTime = Date.now();
        loggingUtils.logEvent('test1', { data: 1 });
        
        // Simulate time passing
        jest.advanceTimersByTime(1000);
        const midTime = Date.now();
        loggingUtils.logEvent('test2', { data: 2 });
        
        jest.advanceTimersByTime(1000);
        const endTime = Date.now();
        loggingUtils.logEvent('test3', { data: 3 });

        const midRangeLogs = loggingUtils.getLogsByTimeRange(startTime, midTime);
        expect(midRangeLogs).toHaveLength(2);
        expect(midRangeLogs[0].data.data).toBe(1);
        expect(midRangeLogs[1].data.data).toBe(2);
    });

    test('should retrieve logs by session', () => {
        const sessionId = loggingUtils.getSessionId();
        loggingUtils.logEvent('test1', { data: 1 });
        loggingUtils.logEvent('test2', { data: 2 });

        const sessionLogs = loggingUtils.getLogsBySession(sessionId);
        expect(sessionLogs).toHaveLength(2);
        expect(sessionLogs[0].data.data).toBe(1);
        expect(sessionLogs[1].data.data).toBe(2);
    });

    test('should maintain consistent session ID', () => {
        const sessionId1 = loggingUtils.getSessionId();
        const sessionId2 = loggingUtils.getSessionId();
        expect(sessionId1).toBe(sessionId2);
    });

    test('should clear logs', () => {
        loggingUtils.logEvent('test1', { data: 1 });
        loggingUtils.logEvent('test2', { data: 2 });
        
        loggingUtils.clearLogs();
        
        expect(loggingUtils.logs).toHaveLength(0);
        expect(JSON.parse(localStorage.getItem('math_logs'))).toHaveLength(0);
    });
}); 