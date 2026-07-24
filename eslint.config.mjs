import docusaurus from '@docusaurus/eslint-plugin';
import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx}'],
    plugins: {
      '@docusaurus': docusaurus,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...docusaurus.configs.recommended.rules,
      ...prettier.rules,
      'no-unused-vars': 'warn',
      'no-undef': 'error',
    },
  },
  {
    ignores: ['build/**', '.docusaurus/**', '.cache-loader/**'],
  },
];
