/**
 * Jest setup configuration.
 * Sets up test environment with necessary mocks and extensions.
 */

// Add custom matchers
expect.extend({
  toHaveComputedStyle(element, property, expectedValue) {
    const computedStyle = window.getComputedStyle(element);
    const pass = computedStyle[property] === expectedValue;
    return {
      pass,
      message: () =>
        `expected element to have computed style "${property}: ${expectedValue}" but got "${computedStyle[property]}"`
    };
  }
});

// Mock window methods
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {
    this.observe = jest.fn();
    this.unobserve = jest.fn();
    this.disconnect = jest.fn();
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {
    this.observe = jest.fn();
    this.unobserve = jest.fn();
    this.disconnect = jest.fn();
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock requestAnimationFrame
global.requestAnimationFrame = callback => setTimeout(callback, 0);
global.cancelAnimationFrame = jest.fn();

// Add custom DOM environment setup
document.createRange = () => ({
  setStart: () => {},
  setEnd: () => {},
  commonAncestorContainer: {
    nodeName: 'BODY',
    ownerDocument: document
  },
  createContextualFragment: jest.fn()
});

// Add MutationObserver mock
global.MutationObserver = class {
  constructor(callback) {
    this.callback = callback;
    this.observe = jest.fn();
    this.disconnect = jest.fn();
    this.takeRecords = jest.fn();
  }
};

// Add custom error handler
window.onerror = (message, source, line, column, error) => {
  console.error('Test environment error:', { message, source, line, column, error });
}; 