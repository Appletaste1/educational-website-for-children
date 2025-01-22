import { parentDashboard } from '../parent-dashboard.js';
import { visualizationUtils } from '../utils/visualization-utils.js';
import { MATH_CONFIG } from '../config/math-config.js';

// Mock dependencies
jest.mock('../utils/visualization-utils.js');
jest.mock('../utils/metrics-utils.js');

// Mock WebSocket
class MockWebSocket {
    constructor(url) {
        this.url = url;
        this.onmessage = null;
        this.onerror = null;
        this.readyState = WebSocket.OPEN;
    }

    send(data) {
        // Mock send implementation
    }

    close() {
        this.readyState = WebSocket.CLOSED;
    }
}

global.WebSocket = MockWebSocket;

// Mock DOM elements
document.body.innerHTML = `
    <div class="progress-meters-container"></div>
    <div class="notifications-container"></div>
    <div class="widget-container">
        <div class="widget" draggable="true">Widget 1</div>
        <div class="widget" draggable="true">Widget 2</div>
    </div>
`;

describe('ParentDashboard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        // Reset DOM
        document.querySelector('.progress-meters-container').innerHTML = '';
        document.querySelector('.notifications-container').innerHTML = '';

        // Mock visualization utils responses
        visualizationUtils.getProgressMeterConfig.mockResolvedValue({
            accuracy: {
                value: 80,
                color: '#4CAF50',
                threshold: 70
            },
            speed: {
                value: 65,
                color: '#FF9800',
                threshold: 50
            },
            improvement: {
                value: 25,
                color: '#2196F3',
                threshold: 20
            }
        });
    });

    afterEach(() => {
        jest.useRealTimers();
        parentDashboard.destroy();
    });

    describe('Initialization', () => {
        test('should initialize progress meters correctly', async () => {
            await parentDashboard.initialize('test_session');
            
            const meters = document.querySelectorAll('.progress-meter');
            expect(meters).toHaveLength(3);
            expect(meters[0]).toHaveClass('accuracy-meter');
            expect(meters[1]).toHaveClass('speed-meter');
            expect(meters[2]).toHaveClass('improvement-meter');
        });

        test('should handle WebSocket connection failure gracefully', async () => {
            const mockWs = new MockWebSocket('ws://localhost:8080/dashboard');
            mockWs.onerror(new Error('Connection failed'));
            
            await parentDashboard.initialize('test_session');
            expect(parentDashboard.usePolling).toBe(true);
        });
    });

    describe('Progress Meters', () => {
        test('should update progress meters with correct values', async () => {
            await parentDashboard.initialize('test_session');
            await parentDashboard.updateProgressMeters();

            const accuracyMeter = document.querySelector('.accuracy-meter');
            const speedMeter = document.querySelector('.speed-meter');
            
            expect(accuracyMeter.querySelector('.value-display').textContent).toBe('80%');
            expect(speedMeter.querySelector('.value-display').textContent).toBe('65%');
        });

        test('should animate progress meter updates smoothly', async () => {
            await parentDashboard.initialize('test_session');
            
            const meter = {
                element: document.querySelector('.accuracy-meter'),
                currentValue: 50,
                targetValue: 80
            };

            parentDashboard.animateProgressMeter(meter, { value: 80 });
            
            // Fast-forward animation
            jest.advanceTimersByTime(500); // Half-way through
            expect(meter.currentValue).toBeCloseTo(65, 0);
            
            jest.advanceTimersByTime(500); // Complete
            expect(meter.currentValue).toBe(80);
        });

        test('should update meter colors based on values', async () => {
            await parentDashboard.initialize('test_session');
            await parentDashboard.updateProgressMeters();

            const accuracyMeter = document.querySelector('.accuracy-meter .progress-bar');
            const speedMeter = document.querySelector('.speed-meter .progress-bar');
            
            expect(accuracyMeter.style.backgroundColor).toBe('#4CAF50');
            expect(speedMeter.style.backgroundColor).toBe('#FF9800');
        });
    });

    describe('Real-time Updates', () => {
        test('should handle WebSocket updates correctly', async () => {
            await parentDashboard.initialize('test_session');
            
            const mockData = {
                type: 'metrics',
                sessionId: 'test_session',
                metrics: {
                    accuracy: 85,
                    speed: 70
                }
            };

            parentDashboard.handleRealtimeUpdate(mockData);
            expect(visualizationUtils.getProgressMeterConfig).toHaveBeenCalledTimes(2);
        });

        test('should adjust update frequency based on idle state', () => {
            parentDashboard.isIdle = false;
            parentDashboard.adjustUpdateFrequency();
            expect(parentDashboard.updateInterval).toBe(5000);

            parentDashboard.isIdle = true;
            parentDashboard.adjustUpdateFrequency();
            expect(parentDashboard.updateInterval).toBe(30000);
        });

        test('should reset idle timer on user activity', () => {
            parentDashboard.isIdle = true;
            parentDashboard.resetIdleTimer();
            
            expect(parentDashboard.isIdle).toBe(false);
            expect(parentDashboard.lastActivityTime).toBeCloseTo(Date.now(), -2);
        });
    });

    describe('Performance Monitoring', () => {
        test('should track update performance', async () => {
            await parentDashboard.initialize('test_session');
            
            // Simulate slow updates
            visualizationUtils.getProgressMeterConfig.mockImplementation(() => 
                new Promise(resolve => setTimeout(() => resolve({
                    accuracy: { value: 80, color: '#4CAF50', threshold: 70 }
                }), 1500))
            );

            await parentDashboard.updateProgressMeters();
            jest.advanceTimersByTime(2000);
            
            expect(parentDashboard.performanceStats.updateTimes.length).toBeGreaterThan(0);
            expect(parentDashboard.performanceStats.updateTimes[0]).toBeGreaterThan(1000);
        });

        test('should generate performance warnings when needed', async () => {
            await parentDashboard.initialize('test_session');
            
            // Simulate multiple slow updates
            parentDashboard.performanceStats.updateTimes = Array(10).fill(1500);
            parentDashboard.checkPerformance();
            
            const warning = document.querySelector('.performance-warning');
            expect(warning).toBeTruthy();
            expect(warning.textContent).toContain('High update latency detected');
        });

        test('should limit performance warning frequency', () => {
            parentDashboard.handlePerformanceWarning('Test warning');
            const firstWarning = document.querySelector('.performance-warning');
            expect(firstWarning).toBeTruthy();

            // Try to show another warning immediately
            parentDashboard.handlePerformanceWarning('Another warning');
            const warnings = document.querySelectorAll('.performance-warning');
            expect(warnings).toHaveLength(1);
        });
    });

    describe('Widget Customization', () => {
        test('should handle widget drag and drop', () => {
            const container = document.querySelector('.widget-container');
            const widgets = container.querySelectorAll('.widget');
            
            // Simulate drag start
            const dragStartEvent = new Event('dragstart');
            widgets[0].dispatchEvent(dragStartEvent);
            expect(widgets[0]).toHaveClass('dragging');

            // Simulate drag end
            const dragEndEvent = new Event('dragend');
            widgets[0].dispatchEvent(dragEndEvent);
            expect(widgets[0]).not.toHaveClass('dragging');
        });

        test('should calculate correct drag position', () => {
            const container = document.querySelector('.widget-container');
            const widgets = container.querySelectorAll('.widget');
            
            // Mock getBoundingClientRect for widgets
            widgets[0].getBoundingClientRect = () => ({
                top: 0,
                height: 50
            });
            widgets[1].getBoundingClientRect = () => ({
                top: 50,
                height: 50
            });

            const afterElement = parentDashboard.getDragAfterElement(container, 75);
            expect(afterElement).toBe(widgets[1]);
        });
    });

    describe('Cleanup', () => {
        test('should clean up resources on destroy', () => {
            parentDashboard.initialize('test_session');
            const ws = parentDashboard.ws;
            
            parentDashboard.destroy();
            
            expect(parentDashboard.meters.size).toBe(0);
            expect(parentDashboard.charts.size).toBe(0);
            expect(ws.readyState).toBe(WebSocket.CLOSED);
        });
    });
}); 