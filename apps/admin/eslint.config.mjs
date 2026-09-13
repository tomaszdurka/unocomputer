import { base } from '../../eslint.config.base.mjs';
import coreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  ...base,
  ...coreWebVitals,
  { ignores: ['next-env.d.ts'] },
];

export default config;
