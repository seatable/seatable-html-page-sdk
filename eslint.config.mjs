import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'rollup.config.js',
      'dist/',
      'lib/',
      'build/',
      'es/',
      'public/',
    ],
  },

  js.configs.recommended,

  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      // airbnb
      'no-confusing-arrow': 'off',
      'no-restricted-globals': 'off',
      camelcase: 'off',

      'no-plusplus': ['warn', { allowForLoopAfterthoughts: true }],
      indent: ['warn', 2, { SwitchCase: 1 }],
      quotes: ['warn', 'single'],
      semi: ['warn', 'always'],
      'no-trailing-spaces': 'warn',
      'no-console': 'warn',

      'no-unused-vars': ['error', { caughtErrors: 'none' }],

      'prefer-const': 'off',
      'no-continue': 'off',
      'no-underscore-dangle': 'off',
      'no-use-before-define': 'off',
      'max-len': 'off',
      'prefer-object-spread': 'off',
      'no-useless-escape': 'off',
      'no-return-assign': 'off',
      'object-curly-newline': 'off',
      'function-paren-newline': 'off',
      'arrow-body-style': 'off',
      'arrow-parens': 'off',
      'comma-dangle': 'off',
      'dot-notation': 'off',
      'prefer-template': 'off',
      'array-bracket-spacing': 'off',
      'prefer-destructuring': 'off',
      'class-methods-use-this': 'off',

      'no-param-reassign': ['error', { props: false }],
      radix: ['error', 'as-needed'],
    },
  },

  {
    files: ['tests/**/*.js', '__tests__/**/*.js', '**/*.test.js', '**/*.spec.js'],
    rules: {
      'no-console': 'off',
    },
  },
];
