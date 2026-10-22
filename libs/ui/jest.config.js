const nextJest = require('next/jest');
const pkg = require('./package.json');

// No `dir`: that would make next/jest look for a Next.js app (pages/app directory,
// next.config) that a component library does not have. Without it, next/jest still
// supplies the SWC transform and the CSS/image mocks, which is all the specs need.
const createJestConfig = nextJest();

// The specs import '@app/ui' and its subpaths exactly as the apps do, so a broken
// entry in the package's `exports` map fails here before it fails in an app.
const moduleNameMapper = Object.fromEntries(
  Object.entries(pkg.exports).map(([subpath, file]) => [
    `^@app/ui${subpath.slice(1)}$`,
    `<rootDir>/${file.slice(2)}`,
  ]),
);

/** @type {import('jest').Config} */
const config = {
  displayName: 'ui',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper,
  testMatch: ['<rootDir>/src/**/*.spec.{ts,tsx}'],
  passWithNoTests: true,
};

module.exports = createJestConfig(config);
