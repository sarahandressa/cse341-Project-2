// jest.config.js (ISOLAMENTO TOTAL)

module.exports = {
  testEnvironment: 'node',
  // REMOVED: globalSetup: './tests/setup.js', 
  // REMOVED: globalTeardown: './tests/teardown.js',
  // We handle MongoMemoryServer lifecycle *inside* each test file now.
  testMatch: ['**/__tests__/**/*.test.js'],
  testTimeout: 60000, // Increased timeout to 60s for safety in isolation mode
};