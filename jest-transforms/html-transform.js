/**
 * Jest transform for HTML files.
 * Converts HTML files into JS modules for testing.
 */

const path = require('path');
const fs = require('fs');

module.exports = {
  process(sourceText, sourcePath, options) {
    // Read the HTML file
    const content = fs.readFileSync(sourcePath, 'utf8');

    // Create a module that exports the HTML content
    return {
      code: `module.exports = ${JSON.stringify(content)};`
    };
  },

  // Optional: specify cache key generation
  getCacheKey(fileData, filename, configString, options) {
    return JSON.stringify({
      fileData,
      filename,
      configString,
      options
    });
  }
}; 