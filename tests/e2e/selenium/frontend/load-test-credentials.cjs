/**
 * Load Test Credentials Helper
 * 
 * This module loads test credentials from .env.test file
 * and provides them to test scripts.
 * 
 * Usage:
 *   const credentials = require('./load-test-credentials');
 *   const email = credentials.email;
 *   const password = credentials.password;
 */

const fs = require('fs');
const path = require('path');

// Path to .env.test file (in apps/frontend directory)
// From tests/e2e/selenium/frontend/, go up 4 levels to repo root, then to apps/frontend
const envTestPath = path.join(__dirname, '../../../../apps/frontend/.env.test');

// Load credentials from .env.test file
function loadCredentials() {
  const credentials = {
    email: null,
    password: null,
    apiGatewayUrl: null,
    apiGatewayKey: null,
    appUrl: null
  };

  // Check if .env.test file exists
  if (!fs.existsSync(envTestPath)) {
    return credentials;
  }

  // Read and parse .env.test file
  try {
    // Check if file is readable (permissions check)
    try {
      fs.accessSync(envTestPath, fs.constants.R_OK);
    } catch (accessError) {
      // File exists but not readable, or permission denied
      if (accessError.code === 'EACCES' || accessError.code === 'EPERM') {
        console.warn(`Warning: Permission denied reading .env.test file. Using environment variables instead.`);
        return credentials; // Return empty credentials, will fall back to env vars
      }
      // File doesn't exist or other error
      return credentials;
    }
    
    const envContent = fs.readFileSync(envTestPath, 'utf8');
    const lines = envContent.split('\n');

    lines.forEach(line => {
      // Skip comments and empty lines
      line = line.trim();
      if (!line || line.startsWith('#')) {
        return;
      }

      // Parse KEY=VALUE format
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        switch (key) {
          case 'TEST_USER_EMAIL':
            credentials.email = value;
            break;
          case 'TEST_USER_PASSWORD':
            credentials.password = value;
            break;
          case 'VITE_API_GATEWAY_URL':
            credentials.apiGatewayUrl = value;
            break;
          case 'VITE_API_GATEWAY_KEY':
            credentials.apiGatewayKey = value;
            break;
          case 'VITE_APP_URL':
            credentials.appUrl = value;
            break;
        }
      }
    });
  } catch (error) {
    // Handle permission errors gracefully
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      console.warn(`Warning: Permission denied reading .env.test file: ${error.message}`);
      console.warn(`   Using environment variables instead.`);
    } else {
      console.warn(`Warning: Could not read .env.test file: ${error.message}`);
    }
  }

  return credentials;
}

// Export credentials
const credentials = loadCredentials();

module.exports = {
  email: credentials.email || process.env.TEST_USER_EMAIL || null,
  password: credentials.password || process.env.TEST_USER_PASSWORD || null,
  apiGatewayUrl: credentials.apiGatewayUrl || process.env.VITE_API_GATEWAY_URL || null,
  apiGatewayKey: credentials.apiGatewayKey || process.env.VITE_API_GATEWAY_KEY || null,
  appUrl: credentials.appUrl || process.env.VITE_APP_URL || null,
  
  // Helper to check if credentials are available
  hasCredentials: function() {
    return !!(this.email && this.password);
  },
  
  // Helper to get credentials object
  getCredentials: function() {
    return {
      email: this.email,
      password: this.password
    };
  }
};
