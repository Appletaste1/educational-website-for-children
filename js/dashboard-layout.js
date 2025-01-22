import { visualizationUtils } from './utils/visualization-utils.js';
import { MATH_CONFIG } from './config/math-config.js';
import PerformanceGraph from './widgets/performance-graph.js';
import ActivityFeed from './widgets/activity-feed.js';

class DashboardLayout {
    constructor() {
        this.containers = new Map();
        this.widgets = new Map();
        this.layout = {
            desktop: {
                columns: 3,
                breakpoint: 1024
            },
            tablet: {
                columns: 2,
                breakpoint: 768
            },
            mobile: {
                columns: 1,
                breakpoint: 0
            }
        };
        
        this.initializeLayout();
        this.initializeEventListeners();
        this.loadSavedState();
    }

    initializeLayout() {
        // Create main container grid
        const dashboardGrid = document.createElement('div');
        dashboardGrid.className = 'dashboard-grid';
        document.querySelector('.dashboard-container').appendChild(dashboardGrid);

        // Initialize default containers
        this.createContainer('academic-progress', 'Academic Progress');
        this.createContainer('recent-activities', 'Recent Activities');
        this.createContainer('achievements', 'Achievements');

        this.applyResponsiveLayout();
    }

    createContainer(id, title) {
        const container = document.createElement('div');
        container.className = 'widget-container';
        container.dataset.containerId = id;
        
        const header = document.createElement('div');
        header.className = 'container-header';
        header.innerHTML = `
            <h2>${title}</h2>
            <div class="container-controls">
                <button class="add-widget-btn">Add Widget</button>
                <button class="customize-btn">Customize</button>
            </div>
        `;

        container.appendChild(header);
        document.querySelector('.dashboard-grid').appendChild(container);
        
        this.containers.set(id, {
            element: container,
            widgets: new Set(),
            config: {
                title,
                isCollapsed: false,
                order: this.containers.size
            }
        });

        this.initializeContainerControls(container);
    }

    initializeContainerControls(container) {
        const addBtn = container.querySelector('.add-widget-btn');
        const customizeBtn = container.querySelector('.customize-btn');

        addBtn.addEventListener('click', () => this.showWidgetLibrary(container));
        customizeBtn.addEventListener('click', () => this.showCustomizeMenu(container));

        // Make container draggable
        container.setAttribute('draggable', true);
        this.initializeDragAndDrop(container);
    }

    showWidgetLibrary(container) {
        const modal = document.createElement('div');
        modal.className = 'widget-library-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Add Widget</h3>
                <div class="widget-list">
                    ${this.getAvailableWidgets(container).map(widget => `
                        <div class="widget-option" data-widget-type="${widget.type}">
                            <h4>${widget.title}</h4>
                            <p>${widget.description}</p>
                        </div>
                    `).join('')}
                </div>
                <button class="close-btn">Close</button>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
        modal.querySelectorAll('.widget-option').forEach(option => {
            option.addEventListener('click', () => {
                this.addWidget(container.dataset.containerId, option.dataset.widgetType);
                modal.remove();
            });
        });
    }

    getAvailableWidgets(container) {
        const containerId = container.dataset.containerId;
        const widgets = [];

        if (containerId === 'academic-progress') {
            widgets.push(
                {
                    type: 'progress-meters',
                    title: 'Progress Meters',
                    description: 'Real-time progress indicators for accuracy, speed, and improvement'
                },
                {
                    type: 'performance-graph',
                    title: 'Performance Graph',
                    description: 'Historical view of learning progress over time'
                }
            );
        } else if (containerId === 'recent-activities') {
            widgets.push(
                {
                    type: 'activity-feed',
                    title: 'Activity Feed',
                    description: 'Recent learning activities and achievements'
                },
                {
                    type: 'time-tracking',
                    title: 'Time Tracking',
                    description: 'Time spent on different subjects and activities'
                }
            );
        } else if (containerId === 'achievements') {
            widgets.push(
                {
                    type: 'achievement-list',
                    title: 'Achievement List',
                    description: 'List of unlocked and upcoming achievements'
                },
                {
                    type: 'milestone-timeline',
                    title: 'Milestone Timeline',
                    description: 'Timeline of important learning milestones'
                }
            );
        }

        return widgets;
    }

    showCustomizeMenu(container) {
        const containerId = container.dataset.containerId;
        const containerConfig = this.containers.get(containerId).config;

        const modal = document.createElement('div');
        modal.className = 'customize-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Customize Container</h3>
                <div class="customize-options">
                    <div class="option">
                        <label>Title</label>
                        <input type="text" class="title-input" value="${containerConfig.title}">
                    </div>
                    <div class="option">
                        <label>
                            <input type="checkbox" class="collapse-input" ${containerConfig.isCollapsed ? 'checked' : ''}>
                            Collapse container
                        </label>
                    </div>
                    <div class="option">
                        <label>Display Mode</label>
                        <select class="display-mode">
                            <option value="normal">Normal</option>
                            <option value="compact">Compact</option>
                            <option value="detailed">Detailed</option>
                        </select>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="save-btn">Save</button>
                    <button class="cancel-btn">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.save-btn').addEventListener('click', () => {
            this.updateContainerConfig(containerId, {
                title: modal.querySelector('.title-input').value,
                isCollapsed: modal.querySelector('.collapse-input').checked,
                displayMode: modal.querySelector('.display-mode').value
            });
            modal.remove();
        });

        modal.querySelector('.cancel-btn').addEventListener('click', () => modal.remove());
    }

    updateContainerConfig(containerId, newConfig) {
        const container = this.containers.get(containerId);
        container.config = { ...container.config, ...newConfig };

        // Update DOM
        const element = container.element;
        element.querySelector('h2').textContent = newConfig.title;
        element.classList.toggle('collapsed', newConfig.isCollapsed);
        element.dataset.displayMode = newConfig.displayMode;

        this.saveState();
    }

    addWidget(containerId, widgetType) {
        const container = this.containers.get(containerId);
        if (!container) return;

        const widgetId = `widget-${Date.now()}`;
        const widget = this.createWidget(widgetType, widgetId);
        
        container.element.appendChild(widget);
        container.widgets.add(widgetId);
        
        this.widgets.set(widgetId, {
            type: widgetType,
            element: widget,
            config: this.getDefaultWidgetConfig(widgetType)
        });

        this.saveState();
    }

    createWidget(type, id) {
        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.widgetId = id;
        widget.dataset.widgetType = type;
        
        const header = document.createElement('div');
        header.className = 'widget-header';
        header.innerHTML = `
            <h3>${this.getWidgetTitle(type)}</h3>
            <div class="widget-controls">
                <button class="customize-widget-btn">⚙️</button>
                <button class="remove-widget-btn">✖️</button>
            </div>
        `;

        const content = document.createElement('div');
        content.className = 'widget-content';

        widget.appendChild(header);
        widget.appendChild(content);

        this.initializeWidgetControls(widget);
        this.initializeWidgetContent(widget, type);

        return widget;
    }

    getWidgetTitle(type) {
        const titles = {
            'progress-meters': 'Progress Meters',
            'performance-graph': 'Performance Graph',
            'activity-feed': 'Activity Feed',
            'time-tracking': 'Time Tracking',
            'achievement-list': 'Achievements',
            'milestone-timeline': 'Milestones'
        };
        return titles[type] || 'Widget';
    }

    getDefaultWidgetConfig(type) {
        const baseConfig = {
            refreshInterval: 30000,
            displayMode: 'normal',
            isCollapsed: false,
            customTitle: this.getWidgetTitle(type)
        };

        switch (type) {
            case 'performance-graph':
                return {
                    ...baseConfig,
                    timeRange: 'week',
                    metricTypes: ['accuracy', 'speed', 'improvement']
                };
            case 'activity-feed':
                return {
                    ...baseConfig,
                    maxItems: 50,
                    batchSize: 20,
                    filters: {
                        activityTypes: ['exercise', 'achievement', 'milestone'],
                        dateRange: {
                            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                            end: new Date()
                        }
                    }
                };
            default:
                return baseConfig;
        }
    }

    initializeWidgetControls(widget) {
        const removeBtn = widget.querySelector('.remove-widget-btn');
        const customizeBtn = widget.querySelector('.customize-widget-btn');

        removeBtn.addEventListener('click', () => this.removeWidget(widget));
        customizeBtn.addEventListener('click', () => this.showWidgetCustomizeMenu(widget));

        // Make widget draggable within container
        widget.setAttribute('draggable', true);
        this.initializeWidgetDragAndDrop(widget);
    }

    initializeWidgetContent(widget, type) {
        const content = widget.querySelector('.widget-content');
        
        switch (type) {
            case 'progress-meters':
                this.initializeProgressMeters(content);
                break;
            case 'performance-graph':
                this.initializePerformanceGraph(content, widget.dataset.widgetId);
                break;
            case 'activity-feed':
                this.initializeActivityFeed(content, widget.dataset.widgetId);
                break;
            // Add more widget type initializations as needed
        }
    }

    async initializeProgressMeters(content) {
        const meters = await visualizationUtils.getProgressMeterConfig(this.currentSessionId);
        content.innerHTML = `
            <div class="progress-meters">
                ${Object.entries(meters).map(([type, config]) => `
                    <div class="meter ${type}-meter">
                        <div class="meter-label">${this.getMeterLabel(type)}</div>
                        <div class="meter-value">${Math.round(config.value)}%</div>
                        <div class="meter-bar" style="width: ${config.value}%; background-color: ${config.color}">
                            <div class="threshold-marker" style="left: ${config.threshold}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getMeterLabel(type) {
        const labels = {
            accuracy: 'Accuracy Rate',
            speed: 'Response Speed',
            improvement: 'Overall Improvement'
        };
        return labels[type] || type;
    }

    async initializePerformanceGraph(content, widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget) return;

        const config = widget.config;
        const graph = new PerformanceGraph(content, {
            timeRange: config.timeRange || 'week',
            metricTypes: config.metricTypes || ['accuracy', 'speed', 'improvement'],
            refreshInterval: config.refreshInterval || 30000
        });

        // Store graph instance for cleanup
        widget.graphInstance = graph;
    }

    async initializeActivityFeed(content, widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget) return;

        const config = widget.config;
        const feed = new ActivityFeed(content, {
            maxItems: config.maxItems || 50,
            batchSize: config.batchSize || 20,
            refreshInterval: config.refreshInterval || 30000,
            filters: config.filters || {
                activityTypes: ['exercise', 'achievement', 'milestone'],
                dateRange: {
                    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    end: new Date()
                }
            }
        });

        // Store feed instance for cleanup
        widget.feedInstance = feed;
    }

    removeWidget(widget) {
        const widgetId = widget.dataset.widgetId;
        const containerId = widget.closest('.widget-container').dataset.containerId;
        const widgetInstance = this.widgets.get(widgetId);
        
        // Cleanup widget-specific resources
        if (widgetInstance) {
            if (widgetInstance.graphInstance) {
                widgetInstance.graphInstance.destroy();
            }
            if (widgetInstance.feedInstance) {
                widgetInstance.feedInstance.destroy();
            }
        }
        
        this.containers.get(containerId).widgets.delete(widgetId);
        this.widgets.delete(widgetId);
        widget.remove();
        
        this.saveState();
    }

    showWidgetCustomizeMenu(widget) {
        const widgetId = widget.dataset.widgetId;
        const widgetInstance = this.widgets.get(widgetId);
        const widgetConfig = widgetInstance.config;
        const type = widgetInstance.type;

        const modal = document.createElement('div');
        modal.className = 'customize-modal';
        
        let additionalOptions = '';
        if (type === 'performance-graph') {
            additionalOptions = `
                <div class="option">
                    <label>Default Time Range</label>
                    <select class="time-range">
                        <option value="day" ${widgetConfig.timeRange === 'day' ? 'selected' : ''}>Day</option>
                        <option value="week" ${widgetConfig.timeRange === 'week' ? 'selected' : ''}>Week</option>
                        <option value="month" ${widgetConfig.timeRange === 'month' ? 'selected' : ''}>Month</option>
                    </select>
                </div>
                <div class="option">
                    <label>Metrics to Show</label>
                    <div class="metric-options">
                        <label>
                            <input type="checkbox" value="accuracy" 
                                ${widgetConfig.metricTypes.includes('accuracy') ? 'checked' : ''}>
                            Accuracy
                        </label>
                        <label>
                            <input type="checkbox" value="speed"
                                ${widgetConfig.metricTypes.includes('speed') ? 'checked' : ''}>
                            Speed
                        </label>
                        <label>
                            <input type="checkbox" value="improvement"
                                ${widgetConfig.metricTypes.includes('improvement') ? 'checked' : ''}>
                            Improvement
                        </label>
                    </div>
                </div>
            `;
        } else if (type === 'activity-feed') {
            additionalOptions = `
                <div class="option">
                    <label>Maximum Items</label>
                    <input type="number" class="max-items" value="${widgetConfig.maxItems}" min="10" max="100">
                </div>
                <div class="option">
                    <label>Batch Size</label>
                    <input type="number" class="batch-size" value="${widgetConfig.batchSize}" min="5" max="50">
                </div>
                <div class="option">
                    <label>Activity Types</label>
                    <div class="activity-type-options">
                        <label>
                            <input type="checkbox" value="exercise" 
                                ${widgetConfig.filters.activityTypes.includes('exercise') ? 'checked' : ''}>
                            Exercises
                        </label>
                        <label>
                            <input type="checkbox" value="achievement"
                                ${widgetConfig.filters.activityTypes.includes('achievement') ? 'checked' : ''}>
                            Achievements
                        </label>
                        <label>
                            <input type="checkbox" value="milestone"
                                ${widgetConfig.filters.activityTypes.includes('milestone') ? 'checked' : ''}>
                            Milestones
                        </label>
                    </div>
                </div>
                <div class="option">
                    <label>Default Date Range</label>
                    <div class="date-range-options">
                        <input type="date" class="date-start" 
                            value="${widgetConfig.filters.dateRange.start.toISOString().split('T')[0]}">
                        <input type="date" class="date-end"
                            value="${widgetConfig.filters.dateRange.end.toISOString().split('T')[0]}">
                    </div>
                </div>
            `;
        }

        modal.innerHTML = `
            <div class="modal-content">
                <h3>Customize Widget</h3>
                <div class="customize-options">
                    <div class="option">
                        <label>Custom Title</label>
                        <input type="text" class="title-input" value="${widgetConfig.customTitle}">
                    </div>
                    <div class="option">
                        <label>Refresh Interval</label>
                        <select class="refresh-interval">
                            <option value="15000" ${widgetConfig.refreshInterval === 15000 ? 'selected' : ''}>15 seconds</option>
                            <option value="30000" ${widgetConfig.refreshInterval === 30000 ? 'selected' : ''}>30 seconds</option>
                            <option value="60000" ${widgetConfig.refreshInterval === 60000 ? 'selected' : ''}>1 minute</option>
                        </select>
                    </div>
                    <div class="option">
                        <label>Display Mode</label>
                        <select class="display-mode">
                            <option value="normal" ${widgetConfig.displayMode === 'normal' ? 'selected' : ''}>Normal</option>
                            <option value="compact" ${widgetConfig.displayMode === 'compact' ? 'selected' : ''}>Compact</option>
                            <option value="detailed" ${widgetConfig.displayMode === 'detailed' ? 'selected' : ''}>Detailed</option>
                        </select>
                    </div>
                    ${additionalOptions}
                </div>
                <div class="modal-actions">
                    <button class="save-btn">Save</button>
                    <button class="cancel-btn">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.save-btn').addEventListener('click', () => {
            const newConfig = {
                customTitle: modal.querySelector('.title-input').value,
                refreshInterval: parseInt(modal.querySelector('.refresh-interval').value),
                displayMode: modal.querySelector('.display-mode').value
            };

            if (type === 'performance-graph') {
                newConfig.timeRange = modal.querySelector('.time-range').value;
                newConfig.metricTypes = Array.from(
                    modal.querySelectorAll('.metric-options input:checked')
                ).map(input => input.value);
            } else if (type === 'activity-feed') {
                newConfig.maxItems = parseInt(modal.querySelector('.max-items').value);
                newConfig.batchSize = parseInt(modal.querySelector('.batch-size').value);
                newConfig.filters = {
                    activityTypes: Array.from(
                        modal.querySelectorAll('.activity-type-options input:checked')
                    ).map(input => input.value),
                    dateRange: {
                        start: new Date(modal.querySelector('.date-start').value),
                        end: new Date(modal.querySelector('.date-end').value)
                    }
                };
            }

            this.updateWidgetConfig(widgetId, newConfig);
            modal.remove();
        });

        modal.querySelector('.cancel-btn').addEventListener('click', () => modal.remove());
    }

    updateWidgetConfig(widgetId, newConfig) {
        const widget = this.widgets.get(widgetId);
        const oldConfig = widget.config;
        widget.config = { ...oldConfig, ...newConfig };

        // Update DOM
        const element = widget.element;
        element.querySelector('h3').textContent = newConfig.customTitle;
        element.dataset.displayMode = newConfig.displayMode;

        // Reinitialize widget content if needed
        if (newConfig.displayMode !== oldConfig.displayMode ||
            newConfig.refreshInterval !== oldConfig.refreshInterval ||
            newConfig.timeRange !== oldConfig.timeRange ||
            JSON.stringify(newConfig.metricTypes) !== JSON.stringify(oldConfig.metricTypes) ||
            JSON.stringify(newConfig.filters) !== JSON.stringify(oldConfig.filters)) {
            // Cleanup existing instances
            if (widget.graphInstance) {
                widget.graphInstance.destroy();
            }
            if (widget.feedInstance) {
                widget.feedInstance.destroy();
            }
            this.initializeWidgetContent(element, widget.type);
        }

        this.saveState();
    }

    initializeEventListeners() {
        // Handle responsive layout changes
        window.addEventListener('resize', () => {
            this.applyResponsiveLayout();
        });

        // Handle visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshAllWidgets();
            }
        });
    }

    applyResponsiveLayout() {
        const width = window.innerWidth;
        let layout;

        if (width >= this.layout.desktop.breakpoint) {
            layout = this.layout.desktop;
        } else if (width >= this.layout.tablet.breakpoint) {
            layout = this.layout.tablet;
        } else {
            layout = this.layout.mobile;
        }

        const grid = document.querySelector('.dashboard-grid');
        grid.style.gridTemplateColumns = `repeat(${layout.columns}, 1fr)`;
    }

    initializeDragAndDrop(container) {
        container.addEventListener('dragstart', (e) => {
            e.target.classList.add('dragging');
            e.dataTransfer.setData('text/plain', container.dataset.containerId);
        });

        container.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(
                document.querySelector('.dashboard-grid'),
                e.clientY
            );
            const draggable = document.querySelector('.dragging');
            
            if (afterElement) {
                document.querySelector('.dashboard-grid').insertBefore(draggable, afterElement);
            } else {
                document.querySelector('.dashboard-grid').appendChild(draggable);
            }
        });
    }

    initializeWidgetDragAndDrop(widget) {
        widget.addEventListener('dragstart', (e) => {
            e.stopPropagation(); // Prevent container drag
            e.target.classList.add('dragging');
            e.dataTransfer.setData('text/plain', widget.dataset.widgetId);
        });

        widget.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('[draggable]:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    refreshAllWidgets() {
        this.widgets.forEach((widget, id) => {
            this.initializeWidgetContent(widget.element, widget.type);
        });
    }

    saveState() {
        const state = {
            containers: Array.from(this.containers.entries()).map(([id, container]) => ({
                id,
                config: container.config,
                widgets: Array.from(container.widgets)
            })),
            widgets: Array.from(this.widgets.entries()).map(([id, widget]) => ({
                id,
                type: widget.type,
                config: widget.config
            }))
        };

        localStorage.setItem('dashboard_state', JSON.stringify(state));
    }

    loadSavedState() {
        try {
            const savedState = localStorage.getItem('dashboard_state');
            if (!savedState) return;

            const state = JSON.parse(savedState);

            // Restore containers
            state.containers.forEach(containerState => {
                const container = this.containers.get(containerState.id);
                if (container) {
                    container.config = containerState.config;
                    this.updateContainerConfig(containerState.id, containerState.config);
                }
            });

            // Restore widgets
            state.widgets.forEach(widgetState => {
                const containerState = state.containers.find(c => 
                    c.widgets.includes(widgetState.id)
                );
                if (containerState) {
                    this.addWidget(containerState.id, widgetState.type);
                    this.updateWidgetConfig(widgetState.id, widgetState.config);
                }
            });
        } catch (error) {
            console.error('Error loading dashboard state:', error);
        }
    }
}

// Export singleton instance
export const dashboardLayout = new DashboardLayout(); 
