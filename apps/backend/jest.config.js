/** @type {import('jest').Config} */
module.exports = {
  displayName: 'backend',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  passWithNoTests: true,
};
