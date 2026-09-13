import { base } from '../../eslint.config.base.mjs';
import globals from 'globals';

const config = [
  ...base,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      parserOptions: { sourceType: 'module' },
    },
  },
];

export default config;
