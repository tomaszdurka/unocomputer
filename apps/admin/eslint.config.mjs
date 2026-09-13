// Flat config, not .eslintrc. eslint-config-next 16 requires ESLint >= 9 and ships flat
// config only - which is why this diverges from app-template, where the admin is still
// on Next 15 / ESLint 8. The rule set is the same one the template extends.
import coreWebVitals from 'eslint-config-next/core-web-vitals';

export default [
  { ignores: ['node_modules/**', '.next/**', 'next-env.d.ts'] },
  ...coreWebVitals,
];
