import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import angularEslintPlugin from '@angular-eslint/eslint-plugin';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import baseConfig from '../../../eslint.config.mjs';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    ignores: ['**/dist', '**/out-tsc'],
  },
  ...baseConfig,
  ...compat
    .config({
      extends: ['plugin:@nx/typescript'],
    })
    .map((config) => ({
      ...config,
      files: ['**/*.ts'],
      plugins: { '@angular-eslint': angularEslintPlugin },
      rules: {
        ...config.rules,
        '@angular-eslint/directive-selector': [
          'error',
          {
            type: 'attribute',
            prefix: 'metalP3',
            style: 'camelCase',
          },
        ],
        '@angular-eslint/component-selector': [
          'error',
          {
            type: 'element',
            prefix: 'metal-p3',
            style: 'kebab-case',
          },
        ],
        '@angular-eslint/prefer-standalone': 'off',
      },
    })),
  ...compat
    .config({
      extends: [],
    })
    .map((config) => ({
      ...config,
      files: ['**/*.html'],
      rules: {
        ...config.rules,
      },
    })),
];



