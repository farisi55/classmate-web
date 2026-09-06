import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

// ESLint flat config for Classmate website
// Aligned with code conventions in knowledge.md §4 and project requirements

export default [
  // JavaScript/TypeScript files
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Core rules aligned with knowledge.md §9 - no-explicit-any is required
      '@typescript-eslint/no-explicit-any': 'error',

      // Additional TypeScript best practices
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Code quality
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Project-specific exceptions documented below
    },
  },

  // Astro files
  ...eslintPluginAstro.configs['flat/recommended'],
  {
    files: ['**/*.astro'],
    rules: {
      // Astro-specific rules
      // Temporarily disabling this rule - the set:html in BaseLayout.astro is for
      // injecting SVG icons which are static and safe. This will be addressed in Task #017.
      'astro/no-set-html-directive': 'off',
    },
  },

  // Ignore patterns
  {
    ignores: [
      'dist/',
      '.astro/',
      '.wrangler/',
      'node_modules/',
      'src/assets/', // External assets - human-supplied photos/logos
      'public/',
      'backups/', // Backup files from ticker export
      '**/*.d.ts',
      // Configuration files that should not be linted as JavaScript
      '**/*.json',
      '**/*.jsonc',
      '**/*.yaml',
      '**/*.yml',
      '.claude/', // AI assistant configuration
    ],
  },
];
