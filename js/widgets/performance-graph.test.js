import PerformanceGraph from './performance-graph.js';
import { metricsUtils } from '../utils/metrics-utils.js';
import { MATH_CONFIG } from '../config/math-config.js';

// Mock dependencies
jest.mock('../utils/metrics-utils.js');
jest.mock('../config/math-config.js');
jest.mock('chart.js/auto');

describe('PerformanceGraph', () => {
    let container;
    let graph;
    
    beforeEach(() => {
        // Set up DOM environment
        container = document.createElement('div');
        document.body.appendChild(container);

        // Mock metrics data
        metricsUtils.getHistoricalData.mockResolvedValue([
            { timestamp: '2024-03-01T00:00:00Z', value: 75 },
            { timestamp: '2024-03-02T00:00:00Z', value: 80 },
            { timestamp: '2024-03-03T00:00:00Z', value: 85 }
        ]);

        // Initialize graph
        graph = new PerformanceGraph(container);
    });

    afterEach(() => {
        if (graph) {
            graph.destroy();
        }
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should create canvas element and controls', () => {
            expect(container.querySelector('canvas')).toBeTruthy();
            expect(container.querySelector('.performance-graph-controls')).toBeTruthy();
        });

        test('should initialize with default options', () => {
            expect(graph.options.timeRange).toBe('week');
            expect(graph.options.metricTypes).toEqual(['accuracy', 'speed', 'improvement']);
            expect(graph.options.refreshInterval).toBe(30000);
        });

        test('should create WebWorker for data processing', () => {
            expect(graph.worker).toBeTruthy();
        });

        test('should initialize Chart.js with correct configuration', () => {
            expect(graph.chart).toBeTruthy();
            expect(graph.chart.data.datasets).toHaveLength(3);
            expect(graph.chart.options.scales.y.max).toBe(100);
        });
    });

    describe('Data Loading', () => {
        test('should load initial data on creation', async () => {
            await graph.loadData();
            expect(metricsUtils.getHistoricalData).toHaveBeenCalled();
        });

        test('should use cache for repeated requests within timeout', async () => {
            await graph.loadData();
            const firstCallCount = metricsUtils.getHistoricalData.mock.calls.length;
            
            await graph.loadData();
            expect(metricsUtils.getHistoricalData.mock.calls.length).toBe(firstCallCount);
        });

        test('should refresh cache after timeout', async () => {
            await graph.loadData();
            const firstCallCount = metricsUtils.getHistoricalData.mock.calls.length;
            
            // Simulate cache timeout
            jest.advanceTimersByTime(6 * 60 * 1000);
            
            await graph.loadData();
            expect(metricsUtils.getHistoricalData.mock.calls.length).toBe(firstCallCount + 3);
        });

        test('should handle error when loading data', async () => {
            const consoleSpy = jest.spyOn(console, 'error');
            metricsUtils.getHistoricalData.mockRejectedValue(new Error('Test error'));

            await graph.loadData();
            expect(consoleSpy).toHaveBeenCalledWith('Error loading performance data:', expect.any(Error));
        });
    });

    describe('Time Range Controls', () => {
        test('should update time range when control is clicked', () => {
            const dayButton = container.querySelector('[data-range="day"]');
            dayButton.click();
            
            expect(graph.options.timeRange).toBe('day');
        });

        test('should show custom range inputs when custom is selected', () => {
            const customButton = container.querySelector('[data-range="custom"]');
            customButton.click();
            
            expect(container.querySelector('.custom-range').style.display).not.toBe('none');
        });

        test('should apply custom date range', () => {
            const startDate = '2024-03-01';
            const endDate = '2024-03-07';
            
            container.querySelector('.date-start').value = startDate;
            container.querySelector('.date-end').value = endDate;
            container.querySelector('.apply-custom-range').click();
            
            expect(graph.options.timeRange).toBe('custom');
            expect(graph.options.customStart).toEqual(new Date(startDate));
            expect(graph.options.customEnd).toEqual(new Date(endDate));
        });
    });

    describe('Metric Toggles', () => {
        test('should toggle dataset visibility when metric is toggled', () => {
            const accuracyToggle = container.querySelector('[data-metric="accuracy"]');
            accuracyToggle.checked = false;
            accuracyToggle.dispatchEvent(new Event('change'));
            
            expect(graph.chart.data.datasets[0].hidden).toBe(true);
        });

        test('should update chart when metric visibility changes', () => {
            const updateSpy = jest.spyOn(graph.chart, 'update');
            
            const speedToggle = container.querySelector('[data-metric="speed"]');
            speedToggle.checked = false;
            speedToggle.dispatchEvent(new Event('change'));
            
            expect(updateSpy).toHaveBeenCalled();
        });
    });

    describe('WebWorker Integration', () => {
        test('should process data in WebWorker', async () => {
            const workerSpy = jest.spyOn(graph.worker, 'postMessage');
            
            await graph.loadData();
            
            expect(workerSpy).toHaveBeenCalledWith({
                operation: 'transform',
                data: expect.any(Object)
            });
        });

        test('should update chart when worker returns processed data', () => {
            const updateSpy = jest.spyOn(graph.chart, 'update');
            
            // Simulate worker message
            const messageEvent = new MessageEvent('message', {
                data: {
                    operation: 'transform',
                    result: {
                        accuracy: [],
                        speed: [],
                        improvement: []
                    }
                }
            });
            graph.worker.onmessage(messageEvent);
            
            expect(updateSpy).toHaveBeenCalled();
        });
    });

    describe('Auto Refresh', () => {
        test('should refresh data at specified interval when visible', () => {
            jest.useFakeTimers();
            const loadSpy = jest.spyOn(graph, 'loadData');
            
            // Simulate visibility
            Object.defineProperty(document, 'visibilityState', {
                value: 'visible',
                writable: true
            });
            
            jest.advanceTimersByTime(30000);
            expect(loadSpy).toHaveBeenCalled();
            
            jest.useRealTimers();
        });

        test('should not refresh when page is hidden', () => {
            jest.useFakeTimers();
            const loadSpy = jest.spyOn(graph, 'loadData');
            
            // Simulate hidden state
            Object.defineProperty(document, 'visibilityState', {
                value: 'hidden',
                writable: true
            });
            
            jest.advanceTimersByTime(30000);
            expect(loadSpy).not.toHaveBeenCalled();
            
            jest.useRealTimers();
        });
    });

    describe('Cleanup', () => {
        test('should terminate worker and destroy chart on cleanup', () => {
            const workerSpy = jest.spyOn(graph.worker, 'terminate');
            const chartSpy = jest.spyOn(graph.chart, 'destroy');
            
            graph.destroy();
            
            expect(workerSpy).toHaveBeenCalled();
            expect(chartSpy).toHaveBeenCalled();
            expect(graph.cache.size).toBe(0);
        });
    });
}); 