const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: __dirname });

/** @type {import('jest').Config} */
const config = {
  displayName: 'admin',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@app/ui$': '<rootDir>/../../libs/ui/src',
    '^@app/ui/dialog$': '<rootDir>/../../libs/ui/src/Dialog.tsx',
    '^@app/ui/popover$': '<rootDir>/../../libs/ui/src/Popover.tsx',
    '^@app/ui/select$': '<rootDir>/../../libs/ui/src/Select.tsx',
    // react-markdown is ESM-only; map it to a tiny mock so jsdom tests can run
    '^react-markdown$': '<rootDir>/src/test/react-markdown.mock.tsx',
    '^remark-gfm$': '<rootDir>/src/test/remark-gfm.mock.ts',
    '^#/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.{ts,tsx}'],
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  passWithNoTests: true,
};

module.exports = createJestConfig(config);
