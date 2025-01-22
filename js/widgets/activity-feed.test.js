import ActivityFeed from './activity-feed.js';
import { metricsUtils } from '../utils/metrics-utils.js';
import { MATH_CONFIG } from '../config/math-config.js';

// Mock dependencies
jest.mock('../utils/metrics-utils.js');
jest.mock('../config/math-config.js');

describe('ActivityFeed', () => {
    let container;
    let feed;
    let mockWebSocket;
    
    beforeEach(() => {
        // Set up DOM environment
        container = document.createElement('div');
        document.body.appendChild(container);

        // Mock WebSocket
        mockWebSocket = {
            addEventListener: jest.fn(),
            close: jest.fn(),
            send: jest.fn()
        };
        global.WebSocket = jest.fn(() => mockWebSocket);

        // Mock metrics data
        metricsUtils.getActivityEvents.mockResolvedValue([
            {
                id: '1',
                type: 'exercise',
                timestamp: '2024-03-01T10:00:00Z',
                description: 'Completed addition exercise',
                metadata: {
                    subject: 'Math',
                    topic: 'Addition',
                    score: 90,
                    timeSpent: 120
                }
            },
            {
                id: '2',
                type: 'achievement',
                timestamp: '2024-03-01T11:00:00Z',
                description: 'Earned Quick Learner badge',
                metadata: {
                    subject: 'Math',
                    achievementType: 'Quick Learner',
                    reward: 100
                }
            }
        ]);

        // Initialize feed
        feed = new ActivityFeed(container);
    });

    afterEach(() => {
        if (feed) {
            feed.destroy();
        }
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should create UI elements', () => {
            expect(container.querySelector('.activity-feed')).toBeTruthy();
            expect(container.querySelector('.search-bar')).toBeTruthy();
            expect(container.querySelector('.filter-controls')).toBeTruthy();
            expect(container.querySelector('.virtual-scroll-container')).toBeTruthy();
        });

        test('should initialize with default options', () => {
            expect(feed.options.maxItems).toBe(50);
            expect(feed.options.batchSize).toBe(20);
            expect(feed.options.filters.activityTypes).toEqual(['exercise', 'achievement', 'milestone']);
        });

        test('should initialize WebSocket connection', () => {
            expect(WebSocket).toHaveBeenCalledWith('ws://localhost:8080/activity-feed');
            expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('open', expect.any(Function));
            expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
            expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function));
            expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
        });
    });

    describe('Data Loading', () => {
        test('should load initial data on creation', async () => {
            await feed.loadInitialData();
            expect(metricsUtils.getActivityEvents).toHaveBeenCalled();
            expect(container.querySelectorAll('.activity-item')).toHaveLength(2);
        });

        test('should handle error when loading data', async () => {
            const consoleSpy = jest.spyOn(console, 'error');
            metricsUtils.getActivityEvents.mockRejectedValue(new Error('Test error'));

            await feed.loadInitialData();
            expect(consoleSpy).toHaveBeenCalledWith('Error loading initial data:', expect.any(Error));
            expect(container.querySelector('.activity-feed-error')).toBeTruthy();
        });

        test('should load more events when scrolling to bottom', async () => {
            await feed.loadInitialData();
            const initialCallCount = metricsUtils.getActivityEvents.mock.calls.length;

            // Simulate scroll to bottom
            const scrollContainer = container.querySelector('.virtual-scroll-container');
            Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000 });
            Object.defineProperty(scrollContainer, 'clientHeight', { value: 500 });
            scrollContainer.scrollTop = 450;

            scrollContainer.dispatchEvent(new Event('scroll'));
            await new Promise(resolve => setTimeout(resolve, 150)); // Wait for debounce

            expect(metricsUtils.getActivityEvents.mock.calls.length).toBe(initialCallCount + 1);
        });
    });

    describe('Filtering', () => {
        beforeEach(async () => {
            await feed.loadInitialData();
        });

        test('should filter by activity type', () => {
            const exerciseCheckbox = container.querySelector('input[value="exercise"]');
            exerciseCheckbox.checked = false;
            exerciseCheckbox.dispatchEvent(new Event('change'));

            expect(container.querySelectorAll('.activity-item')).toHaveLength(1);
            expect(container.querySelector('.activity-item.achievement')).toBeTruthy();
        });

        test('should filter by date range', () => {
            const dateStart = container.querySelector('.date-start');
            const dateEnd = container.querySelector('.date-end');

            dateStart.value = '2024-03-01';
            dateEnd.value = '2024-03-01';
            dateStart.dispatchEvent(new Event('change'));
            dateEnd.dispatchEvent(new Event('change'));

            expect(container.querySelectorAll('.activity-item')).toHaveLength(2);
        });

        test('should filter by search query', () => {
            const searchInput = container.querySelector('.search-input');
            searchInput.value = 'addition';
            searchInput.dispatchEvent(new Event('input'));

            // Wait for debounce
            jest.advanceTimersByTime(300);

            expect(container.querySelectorAll('.activity-item')).toHaveLength(1);
            expect(container.querySelector('.activity-item.exercise')).toBeTruthy();
        });
    });

    describe('WebSocket Integration', () => {
        test('should handle new activity message', () => {
            const newActivity = {
                id: '3',
                type: 'milestone',
                timestamp: '2024-03-01T12:00:00Z',
                description: 'Completed Level 1',
                metadata: {
                    subject: 'Math',
                    milestoneType: 'Level Completion',
                    progress: 100
                }
            };

            // Simulate WebSocket message
            const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
                call => call[0] === 'message'
            )[1];

            messageHandler({
                data: JSON.stringify({
                    type: 'new_activity',
                    activity: newActivity
                })
            });

            expect(container.querySelectorAll('.activity-item')).toHaveLength(3);
            expect(container.querySelector('.activity-item.milestone')).toBeTruthy();
        });

        test('should handle activity update message', () => {
            const updatedActivity = {
                id: '1',
                type: 'exercise',
                timestamp: '2024-03-01T10:00:00Z',
                description: 'Updated exercise description',
                metadata: {
                    subject: 'Math',
                    topic: 'Addition',
                    score: 95,
                    timeSpent: 120
                }
            };

            const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
                call => call[0] === 'message'
            )[1];

            messageHandler({
                data: JSON.stringify({
                    type: 'update_activity',
                    activity: updatedActivity
                })
            });

            const exerciseItem = container.querySelector('.activity-item.exercise');
            expect(exerciseItem.querySelector('.activity-description').textContent)
                .toBe('Updated exercise description');
            expect(exerciseItem.querySelector('.score').textContent)
                .toBe('Score: 95%');
        });

        test('should attempt reconnection on WebSocket close', () => {
            jest.useFakeTimers();

            const closeHandler = mockWebSocket.addEventListener.mock.calls.find(
                call => call[0] === 'close'
            )[1];

            closeHandler();
            expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);

            jest.advanceTimersByTime(1000);
            expect(WebSocket).toHaveBeenCalledTimes(2);

            jest.useRealTimers();
        });

        test('should show error after max reconnection attempts', () => {
            jest.useFakeTimers();

            const closeHandler = mockWebSocket.addEventListener.mock.calls.find(
                call => call[0] === 'close'
            )[1];

            // Simulate multiple reconnection attempts
            for (let i = 0; i < 6; i++) {
                closeHandler();
                jest.advanceTimersByTime(Math.pow(2, i) * 1000);
            }

            expect(container.querySelector('.activity-feed-error')).toBeTruthy();
            expect(container.querySelector('.activity-feed-error').textContent)
                .toBe('Unable to establish real-time connection');

            jest.useRealTimers();
        });
    });

    describe('Virtual Scrolling', () => {
        test('should render only visible items', async () => {
            // Mock a large dataset
            const largeDataset = Array.from({ length: 100 }, (_, i) => ({
                id: `${i}`,
                type: 'exercise',
                timestamp: new Date().toISOString(),
                description: `Exercise ${i}`,
                metadata: {
                    subject: 'Math',
                    topic: 'Addition',
                    score: 90,
                    timeSpent: 120
                }
            }));

            metricsUtils.getActivityEvents.mockResolvedValue(largeDataset);
            await feed.loadInitialData();

            const scrollContainer = container.querySelector('.virtual-scroll-container');
            const visibleItems = Math.ceil(scrollContainer.clientHeight / feed.virtualScroller.itemHeight);

            expect(container.querySelectorAll('.activity-item')).toHaveLength(visibleItems + 2 * feed.virtualScroller.renderBuffer);
        });

        test('should update rendered items on scroll', async () => {
            const largeDataset = Array.from({ length: 100 }, (_, i) => ({
                id: `${i}`,
                type: 'exercise',
                timestamp: new Date().toISOString(),
                description: `Exercise ${i}`,
                metadata: {
                    subject: 'Math',
                    topic: 'Addition',
                    score: 90,
                    timeSpent: 120
                }
            }));

            metricsUtils.getActivityEvents.mockResolvedValue(largeDataset);
            await feed.loadInitialData();

            const scrollContainer = container.querySelector('.virtual-scroll-container');
            const firstItem = container.querySelector('.activity-item');
            const firstItemText = firstItem.querySelector('.activity-description').textContent;

            // Simulate scroll
            scrollContainer.scrollTop = feed.virtualScroller.itemHeight * 10;
            scrollContainer.dispatchEvent(new Event('scroll'));

            // Wait for debounce
            jest.advanceTimersByTime(100);

            const newFirstItem = container.querySelector('.activity-item');
            const newFirstItemText = newFirstItem.querySelector('.activity-description').textContent;

            expect(newFirstItemText).not.toBe(firstItemText);
        });
    });

    describe('Cleanup', () => {
        test('should clean up resources on destroy', () => {
            feed.destroy();
            expect(mockWebSocket.close).toHaveBeenCalled();
        });

        test('should remove event listeners on destroy', () => {
            const searchInput = container.querySelector('.search-input');
            const removeEventListenerSpy = jest.spyOn(searchInput, 'removeEventListener');

            feed.destroy();
            expect(removeEventListenerSpy).toHaveBeenCalled();
        });
    });
}); 