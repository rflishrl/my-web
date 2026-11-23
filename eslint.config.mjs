import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default defineConfig(
  {
    ignores: ['dist/**', '.astro/**', 'node_modules/**', '.agents/**'],
  },
  js.configs.recommended,
  ts.configs.recommended,
  ...astro.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  eslintConfigPrettier,
);
