// Shared ESLint base for every package in the workspace.
//
// One ESLint major (9) and one config format (flat) across the monorepo. That is forced
// rather than chosen: eslint-config-next 16 requires ESLint >= 9 and ships flat config
// only, so the admin could not stay on the .eslintrc setup the other packages used.
// Rather than run two majors side by side, everything moved up.
//
// Each package composes this with whatever else it needs - the admin adds Next's rules,
// the backend adds node globals - and nothing redefines the shared parts.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export const ignores = {
  ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/*.d.ts'],
};

export const base = [
  ignores,
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // The model CLIs emit arbitrary JSON; lib/json.ts types that precisely as
      // JsonValue/CliEvent. Keeping this an error is what forced that to exist.
      '@typescript-eslint/no-explicit-any': 'error',
      // `_`-prefixed args are the conventional "required by a signature, unused here".
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  // Must stay last: turns off everything that would fight the formatter.
  prettier,
];

export default base;
