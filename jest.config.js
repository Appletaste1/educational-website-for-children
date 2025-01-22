/**
 * Jest configuration for the educational website project.
 * Sets up testing environment with DOM simulation and module transformations.
 */

module.exports = {
  // Test environment setup
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'json', 'html'],

  // Module name mapper for imports
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/js/$1'
  },

  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.html$': '<rootDir>/jest-transforms/html-transform.js'
  },

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/tests/**',
    '!**/node_modules/**'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',

  // Test matching configuration
  testMatch: [
    '<rootDir>/js/tests/**/*.test.js'
  ],

  // Reporter configuration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }]
  ],

  // Global configuration
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true
};