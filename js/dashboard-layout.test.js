import { dashboardLayout } from './dashboard-layout.js';
import { visualizationUtils } from './utils/visualization-utils.js';
import { MATH_CONFIG } from './config/math-config.js';

// Mock dependencies
jest.mock('./utils/visualization-utils.js');
jest.mock('./config/math-config.js');

describe('DashboardLayout', () => {
    let container;
    
    beforeEach(() => {
        // Set up DOM environment
        container = document.createElement('div');
        container.className = 'dashboard-container';
        document.body.appendChild(container);

        // Mock localStorage
        const localStorageMock = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            clear: jest.fn()
        };
        global.localStorage = localStorageMock;

        // Mock visualization utils
        visualizationUtils.getProgressMeterConfig.mockResolvedValue({
            accuracy: { value: 75, color: '#4CAF50', threshold: 80 },
            speed: { value: 60, color: '#2196F3', threshold: 70 },
            improvement: { value: 85, color: '#9C27B0', threshold: 75 }
        });
    });

    afterEach(() => {
        document.body.innerHTML = '';
        localStorage.clear();
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should create default containers on initialization', () => {
            expect(document.querySelectorAll('.widget-container')).toHaveLength(3);
            expect(document.querySelector('[data-container-id="academic-progress"]')).toBeTruthy();
            expect(document.querySelector('[data-container-id="recent-activities"]')).toBeTruthy();
            expect(document.querySelector('[data-container-id="achievements"]')).toBeTruthy();
        });

        test('should apply responsive layout based on window width', () => {
            global.innerWidth = 1200;
            dashboardLayout.applyResponsiveLayout();
            expect(document.querySelector('.dashboard-grid').style.gridTemplateColumns).toBe('repeat(3, 1fr)');

            global.innerWidth = 800;
            dashboardLayout.applyResponsiveLayout();
            expect(document.querySelector('.dashboard-grid').style.gridTemplateColumns).toBe('repeat(2, 1fr)');

            global.innerWidth = 600;
            dashboardLayout.applyResponsiveLayout();
            expect(document.querySelector('.dashboard-grid').style.gridTemplateColumns).toBe('repeat(1, 1fr)');
        });

        test('should load saved state on initialization if available', () => {
            const savedState = {
                containers: [{
                    id: 'academic-progress',
                    config: { title: 'Custom Title', isCollapsed: true },
                    widgets: ['widget-1']
                }],
                widgets: [{
                    id: 'widget-1',
                    type: 'progress-meters',
                    config: { customTitle: 'Custom Widget', refreshInterval: 15000 }
                }]
            };
            localStorage.getItem.mockReturnValue(JSON.stringify(savedState));

            // Re-initialize dashboard to trigger state loading
            document.body.innerHTML = '';
            container = document.createElement('div');
            container.className = 'dashboard-container';
            document.body.appendChild(container);
            
            const dashboard = new DashboardLayout();
            
            const academicContainer = document.querySelector('[data-container-id="academic-progress"]');
            expect(academicContainer.querySelector('h2').textContent).toBe('Custom Title');
            expect(academicContainer.classList.contains('collapsed')).toBe(true);
        });
    });

    describe('Container Management', () => {
        test('should create container with correct structure', () => {
            const container = document.querySelector('[data-container-id="academic-progress"]');
            expect(container.querySelector('.container-header')).toBeTruthy();
            expect(container.querySelector('.add-widget-btn')).toBeTruthy();
            expect(container.querySelector('.customize-btn')).toBeTruthy();
        });

        test('should update container configuration', () => {
            const containerId = 'academic-progress';
            const newConfig = {
                title: 'New Title',
                isCollapsed: true,
                displayMode: 'compact'
            };

            dashboardLayout.updateContainerConfig(containerId, newConfig);

            const container = document.querySelector(`[data-container-id="${containerId}"]`);
            expect(container.querySelector('h2').textContent).toBe('New Title');
            expect(container.classList.contains('collapsed')).toBe(true);
            expect(container.dataset.displayMode).toBe('compact');
        });

        test('should show customize menu with current config', () => {
            const container = document.querySelector('[data-container-id="academic-progress"]');
            dashboardLayout.showCustomizeMenu(container);

            const modal = document.querySelector('.customize-modal');
            expect(modal).toBeTruthy();
            expect(modal.querySelector('.title-input').value).toBe('Academic Progress');
            expect(modal.querySelector('.collapse-input').checked).toBe(false);
        });
    });

    describe('Widget Management', () => {
        test('should add widget to container', () => {
            dashboardLayout.addWidget('academic-progress', 'progress-meters');
            const container = document.querySelector('[data-container-id="academic-progress"]');
            expect(container.querySelector('.widget')).toBeTruthy();
        });

        test('should create widget with correct structure', () => {
            dashboardLayout.addWidget('academic-progress', 'progress-meters');
            const widget = document.querySelector('.widget');
            
            expect(widget.querySelector('.widget-header')).toBeTruthy();
            expect(widget.querySelector('.widget-content')).toBeTruthy();
            expect(widget.querySelector('.customize-widget-btn')).toBeTruthy();
            expect(widget.querySelector('.remove-widget-btn')).toBeTruthy();
        });

        test('should remove widget from container', () => {
            dashboardLayout.addWidget('academic-progress', 'progress-meters');
            const widget = document.querySelector('.widget');
            
            dashboardLayout.removeWidget(widget);
            expect(document.querySelector('.widget')).toBeNull();
        });

        test('should update widget configuration', () => {
            dashboardLayout.addWidget('academic-progress', 'progress-meters');
            const widget = document.querySelector('.widget');
            const widgetId = widget.dataset.widgetId;

            dashboardLayout.updateWidgetConfig(widgetId, {
                customTitle: 'Custom Widget',
                refreshInterval: 15000,
                displayMode: 'detailed'
            });

            expect(widget.querySelector('h3').textContent).toBe('Custom Widget');
            expect(widget.dataset.displayMode).toBe('detailed');
        });
    });

    describe('Progress Meters Widget', () => {
        test('should initialize progress meters with correct data', async () => {
            dashboardLayout.addWidget('academic-progress', 'progress-meters');
            const content = document.querySelector('.widget-content');
            
            await dashboardLayout.initializeProgressMeters(content);
            
            const meters = content.querySelectorAll('.meter');
            expect(meters).toHaveLength(3);
            
            const accuracyMeter = content.querySelector('.accuracy-meter');
            expect(accuracyMeter.querySelector('.meter-value').textContent).toBe('75%');
            expect(accuracyMeter.querySelector('.meter-bar').style.width).toBe('75%');
        });

        test('should update meters on refresh', async () => {
            dashboardLayout.addWidget('academic-progress', 'progress-meters');
            
            visualizationUtils.getProgressMeterConfig.mockResolvedValueOnce({
                accuracy: { value: 80, color: '#4CAF50', threshold: 80 },
                speed: { value: 65, color: '#2196F3', threshold: 70 },
                improvement: { value: 90, color: '#9C27B0', threshold: 75 }
            });

            await dashboardLayout.refreshAllWidgets();
            
            const accuracyValue = document.querySelector('.accuracy-meter .meter-value');
            expect(accuracyValue.textContent).toBe('80%');
        });
    });

    describe('Drag and Drop', () => {
        test('should make containers draggable', () => {
            const container = document.querySelector('[data-container-id="academic-progress"]');
            expect(container.getAttribute('draggable')).toBe('true');
        });

        test('should make widgets draggable', () => {
            dashboardLayout.addWidget('academic-progress', 'progress-meters');
            const widget = document.querySelector('.widget');
            expect(widget.getAttribute('draggable')).toBe('true');
        });

        test('should handle drag events on containers', () => {
            const container = document.querySelector('[data-container-id="academic-progress"]');
            const dragStartEvent = new DragEvent('dragstart', {
                bubbles: true,
                cancelable: true,
                dataTransfer: new DataTransfer()
            });
            
            container.dispatchEvent(dragStartEvent);
            expect(container.classList.contains('dragging')).toBe(true);

            const dragEndEvent = new DragEvent('dragend');
            container.dispatchEvent(dragEndEvent);
            expect(container.classList.contains('dragging')).toBe(false);
        });
    });

    describe('State Management', () => {
        test('should save state to localStorage', () => {
            dashboardLayout.addWidget('academic-progress', 'progress-meters');
            dashboardLayout.saveState();

            expect(localStorage.setItem).toHaveBeenCalled();
            const savedState = JSON.parse(localStorage.setItem.mock.calls[0][1]);
            expect(savedState.containers).toBeTruthy();
            expect(savedState.widgets).toBeTruthy();
        });

        test('should handle errors when loading invalid state', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            localStorage.getItem.mockReturnValue('invalid json');

            dashboardLayout.loadSavedState();
            expect(consoleSpy).toHaveBeenCalledWith('Error loading dashboard state:', expect.any(Error));
        });
    });
}); 