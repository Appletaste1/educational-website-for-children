import { metricsUtils } from '../utils/metrics-utils.js';
import { MATH_CONFIG } from '../config/math-config.js';

class ActivityFeed {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            maxItems: 50,
            batchSize: 20,
            refreshInterval: 30000,
            filters: {
                activityTypes: ['exercise', 'achievement', 'milestone'],
                dateRange: {
                    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    end: new Date()
                }
            },
            ...options
        };

        this.events = [];
        this.filteredEvents = [];
        this.isLoading = false;
        this.hasMore = true;
        this.searchQuery = '';
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.virtualScroller = null;
        this.eventHandlers = new Map();

        this.initializeUI();
        this.initializeWebSocket();
        this.initializeVirtualScroller();
        this.loadInitialData();
    }

    initializeUI() {
        this.container.innerHTML = `
            <div class="activity-feed">
                <div class="activity-feed-header">
                    <div class="search-bar">
                        <input type="text" placeholder="Search activities..." class="search-input">
                        <button class="search-btn">🔍</button>
                    </div>
                    <div class="filter-controls">
                        <div class="activity-type-filters">
                            ${this.options.filters.activityTypes.map(type => `
                                <label>
                                    <input type="checkbox" value="${type}" checked>
                                    ${this.getActivityTypeLabel(type)}
                                </label>
                            `).join('')}
                        </div>
                        <div class="date-range-filter">
                            <input type="date" class="date-start" 
                                value="${this.options.filters.dateRange.start.toISOString().split('T')[0]}">
                            <input type="date" class="date-end"
                                value="${this.options.filters.dateRange.end.toISOString().split('T')[0]}">
                        </div>
                    </div>
                </div>
                <div class="activity-feed-content">
                    <div class="virtual-scroll-container"></div>
                    <div class="loading-indicator" style="display: none;">Loading...</div>
                </div>
            </div>
        `;

        // Initialize event listeners
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Search input
        const searchInput = this.container.querySelector('.search-input');
        searchInput.addEventListener('input', this.debounce(() => {
            this.searchQuery = searchInput.value.trim().toLowerCase();
            this.filterEvents();
        }, 300));

        // Activity type filters
        this.container.querySelectorAll('.activity-type-filters input').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.options.filters.activityTypes = Array.from(
                    this.container.querySelectorAll('.activity-type-filters input:checked')
                ).map(input => input.value);
                this.filterEvents();
            });
        });

        // Date range filters
        const dateStart = this.container.querySelector('.date-start');
        const dateEnd = this.container.querySelector('.date-end');
        
        [dateStart, dateEnd].forEach(input => {
            input.addEventListener('change', () => {
                this.options.filters.dateRange = {
                    start: new Date(dateStart.value),
                    end: new Date(dateEnd.value)
                };
                this.filterEvents();
            });
        });
    }

    initializeWebSocket() {
        try {
            this.socket = new WebSocket('ws://localhost:8080/activity-feed');
            
            this.socket.addEventListener('open', () => {
                console.log('WebSocket connection established');
                this.reconnectAttempts = 0;
            });

            this.socket.addEventListener('message', (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            });

            this.socket.addEventListener('close', () => {
                console.log('WebSocket connection closed');
                this.attemptReconnect();
            });

            this.socket.addEventListener('error', (error) => {
                console.error('WebSocket error:', error);
                this.attemptReconnect();
            });
        } catch (error) {
            console.error('Error initializing WebSocket:', error);
            this.attemptReconnect();
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
            
            setTimeout(() => {
                this.initializeWebSocket();
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
            this.showError('Unable to establish real-time connection');
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'new_activity':
                this.addNewActivity(data.activity);
                break;
            case 'update_activity':
                this.updateActivity(data.activity);
                break;
            case 'batch_activities':
                this.processBatchActivities(data.activities);
                break;
            case 'error':
                this.handleError(data.error);
                break;
        }
    }

    initializeVirtualScroller() {
        const container = this.container.querySelector('.virtual-scroll-container');
        const itemHeight = 80; // Estimated height of each activity item

        this.virtualScroller = {
            container,
            itemHeight,
            visibleItems: Math.ceil(container.clientHeight / itemHeight),
            firstVisibleItem: 0,
            renderBuffer: 5,
            
            updateScroll: () => {
                const scrollTop = container.scrollTop;
                const firstVisible = Math.floor(scrollTop / itemHeight);
                
                if (firstVisible !== this.virtualScroller.firstVisibleItem) {
                    this.virtualScroller.firstVisibleItem = firstVisible;
                    this.renderVisibleItems();
                }
            },
            
            setTotalItems: (count) => {
                container.style.height = `${count * itemHeight}px`;
            }
        };

        container.addEventListener('scroll', this.debounce(() => {
            this.virtualScroller.updateScroll();
            
            // Check if we need to load more items
            const scrolledToBottom = 
                container.scrollHeight - container.scrollTop - container.clientHeight < itemHeight * 2;
            
            if (scrolledToBottom && !this.isLoading && this.hasMore) {
                this.loadMoreEvents();
            }
        }, 100));
    }

    async loadInitialData() {
        this.isLoading = true;
        this.showLoading();

        try {
            const initialEvents = await metricsUtils.getActivityEvents(
                this.options.filters.dateRange.start,
                this.options.filters.dateRange.end,
                this.options.batchSize
            );

            this.events = initialEvents;
            this.filterEvents();
            this.hasMore = initialEvents.length === this.options.batchSize;
            
            this.virtualScroller.setTotalItems(this.filteredEvents.length);
            this.renderVisibleItems();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load activities');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    async loadMoreEvents() {
        if (this.isLoading || !this.hasMore) return;

        this.isLoading = true;
        this.showLoading();

        try {
            const lastEvent = this.events[this.events.length - 1];
            const moreEvents = await metricsUtils.getActivityEvents(
                lastEvent.timestamp,
                this.options.filters.dateRange.end,
                this.options.batchSize,
                { before: true }
            );

            if (moreEvents.length > 0) {
                this.events = [...this.events, ...moreEvents];
                this.filterEvents();
                this.hasMore = moreEvents.length === this.options.batchSize;
                
                this.virtualScroller.setTotalItems(this.filteredEvents.length);
                this.renderVisibleItems();
            } else {
                this.hasMore = false;
            }
        } catch (error) {
            console.error('Error loading more events:', error);
            this.showError('Failed to load more activities');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    filterEvents() {
        this.filteredEvents = this.events.filter(event => {
            // Apply activity type filter
            if (!this.options.filters.activityTypes.includes(event.type)) {
                return false;
            }

            // Apply date range filter
            const eventDate = new Date(event.timestamp);
            if (eventDate < this.options.filters.dateRange.start || 
                eventDate > this.options.filters.dateRange.end) {
                return false;
            }

            // Apply search filter
            if (this.searchQuery) {
                const searchableText = `${event.type} ${event.description} ${event.metadata.subject} ${event.metadata.topic}`.toLowerCase();
                if (!searchableText.includes(this.searchQuery)) {
                    return false;
                }
            }

            return true;
        });

        this.virtualScroller.setTotalItems(this.filteredEvents.length);
        this.renderVisibleItems();
    }

    renderVisibleItems() {
        const { firstVisibleItem, visibleItems, renderBuffer, itemHeight } = this.virtualScroller;
        const start = Math.max(0, firstVisibleItem - renderBuffer);
        const end = Math.min(this.filteredEvents.length, firstVisibleItem + visibleItems + renderBuffer);
        
        const container = this.virtualScroller.container;
        container.innerHTML = '';
        
        const topSpacer = document.createElement('div');
        topSpacer.style.height = `${start * itemHeight}px`;
        container.appendChild(topSpacer);
        
        for (let i = start; i < end; i++) {
            const event = this.filteredEvents[i];
            const eventElement = this.createEventElement(event);
            container.appendChild(eventElement);
        }
        
        const bottomSpacer = document.createElement('div');
        bottomSpacer.style.height = `${(this.filteredEvents.length - end) * itemHeight}px`;
        container.appendChild(bottomSpacer);
    }

    createEventElement(event) {
        const element = document.createElement('div');
        element.className = `activity-item ${event.type}`;
        element.innerHTML = `
            <div class="activity-icon">${this.getActivityIcon(event.type)}</div>
            <div class="activity-content">
                <div class="activity-header">
                    <span class="activity-type">${this.getActivityTypeLabel(event.type)}</span>
                    <span class="activity-time">${this.formatTimestamp(event.timestamp)}</span>
                </div>
                <div class="activity-description">${event.description}</div>
                <div class="activity-metadata">
                    ${event.metadata.subject ? `<span class="subject">${event.metadata.subject}</span>` : ''}
                    ${event.metadata.topic ? `<span class="topic">${event.metadata.topic}</span>` : ''}
                    ${this.renderMetadataDetails(event)}
                </div>
            </div>
        `;
        return element;
    }

    getActivityTypeLabel(type) {
        const labels = {
            exercise: 'Exercise',
            achievement: 'Achievement',
            milestone: 'Milestone'
        };
        return labels[type] || type;
    }

    getActivityIcon(type) {
        const icons = {
            exercise: '📝',
            achievement: '🏆',
            milestone: '🎯'
        };
        return icons[type] || '📋';
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (diff < 604800000) { // Less than 1 week
            const days = Math.floor(diff / 86400000);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    renderMetadataDetails(event) {
        switch (event.type) {
            case 'exercise':
                return `
                    <span class="score">Score: ${event.metadata.score}%</span>
                    <span class="time">Time: ${event.metadata.timeSpent}s</span>
                `;
            case 'achievement':
                return `
                    <span class="achievement-type">${event.metadata.achievementType}</span>
                    ${event.metadata.reward ? `<span class="reward">+${event.metadata.reward}</span>` : ''}
                `;
            case 'milestone':
                return `
                    <span class="milestone-type">${event.metadata.milestoneType}</span>
                    <span class="progress">${event.metadata.progress}%</span>
                `;
            default:
                return '';
        }
    }

    addNewActivity(activity) {
        this.events.unshift(activity);
        if (this.events.length > this.options.maxItems) {
            this.events.pop();
        }
        this.filterEvents();
    }

    updateActivity(activity) {
        const index = this.events.findIndex(e => e.id === activity.id);
        if (index !== -1) {
            this.events[index] = activity;
            this.filterEvents();
        }
    }

    processBatchActivities(activities) {
        this.events = activities.concat(this.events)
            .slice(0, this.options.maxItems);
        this.filterEvents();
    }

    showLoading() {
        const loader = this.container.querySelector('.loading-indicator');
        if (loader) {
            loader.style.display = 'block';
        }
    }

    hideLoading() {
        const loader = this.container.querySelector('.loading-indicator');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'activity-feed-error';
        errorElement.textContent = message;
        
        const existingError = this.container.querySelector('.activity-feed-error');
        if (existingError) {
            existingError.remove();
        }
        
        this.container.querySelector('.activity-feed-content').appendChild(errorElement);
        
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }

    handleError(error) {
        console.error('Activity feed error:', error);
        this.showError(error.message || 'An error occurred');
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    destroy() {
        if (this.socket) {
            this.socket.close();
        }
        
        // Remove event listeners
        this.container.querySelector('.search-input')
            .removeEventListener('input', this.debounce);
        
        this.container.querySelectorAll('.activity-type-filters input')
            .forEach(checkbox => {
                checkbox.removeEventListener('change', this.filterEvents);
            });
        
        const dateInputs = this.container.querySelectorAll('.date-range-filter input');
        dateInputs.forEach(input => {
            input.removeEventListener('change', this.filterEvents);
        });
        
        this.container.querySelector('.virtual-scroll-container')
            .removeEventListener('scroll', this.debounce);
    }
}

export default ActivityFeed; 