import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/tests/**/*.test.ts'],
  // Run test suites sequentially to avoid SQLite lock contention
  maxWorkers: 1,
  testTimeout: 30000,
};

export default config;
