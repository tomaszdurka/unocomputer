const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: __dirname });

// '@app/ui' and its subpaths, derived from the package's own exports map so a
// component added there is resolvable here without touching this file.
const uiPackage = require('../../libs/ui/package.json');
const uiModuleNameMapper = Object.fromEntries(
  Object.entries(uiPackage.exports).map(([subpath, file]) => [
    `^@app/ui${subpath.slice(1)}$`,
    `<rootDir>/../../libs/ui/${file.slice(2)}`,
  ]),
);

/** @type {import('jest').Config} */
const config = {
  displayName: 'admin',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    ...uiModuleNameMapper,
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
