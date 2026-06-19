import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import ngrxEslintPlugin from '@ngrx/eslint-plugin/v9';
import nxEslintPlugin from '@nx/eslint-plugin';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    ignores: ['**/dist', '**/out-tsc'],
  },
  { plugins: { '@nx': nxEslintPlugin } },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  ...compat
    .config({
      extends: ['plugin:@nx/typescript'],
    })
    .map((config) => ({
      ...config,
      files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
      rules: {
        ...config.rules,
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
          },
        ],
      },
    })),
  ...compat
    .config({
      extends: ['plugin:@nx/javascript'],
    })
    .map((config) => ({
      ...config,
      files: ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
      rules: {
        ...config.rules,
      },
    })),
  ...ngrxEslintPlugin.configs.signals.map((config) => ({
    ...config,
    files: ['**/*.ts'],
  })),
  ...compat
    .config({
      extends: ['plugin:@nx/angular-template'],
    })
    .map((config) => ({
      ...config,
      files: ['**/*.component.html'],
      rules: {
        ...config.rules,
        '@angular-eslint/template/alt-text': ['error'],
        '@angular-eslint/template/button-has-type': ['error'],
        '@angular-eslint/template/eqeqeq': ['error'],
        '@angular-eslint/template/prefer-self-closing-tags': ['warn'],
        '@angular-eslint/template/no-interpolation-in-attributes': ['warn'],
      },
    })),
];
