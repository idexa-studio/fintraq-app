// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const RELATIVE = { group: ['../*'], message: "Use the '@/…' alias for anything outside this folder." };
// The legacy folder is gone (phase F); the rule stays so it cannot come back unnoticed.
const LEGACY = { group: ['@/src/*'], message: 'src/ was the legacy tree and no longer exists.' };

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/**'],
  },
  {
    // See docs/ARCHITECTURE.md → Imports
    files: ['app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['warn', { patterns: [RELATIVE] }],
    },
  },
  // The rebooted tree. See docs/ARCHITECTURE.md → Who may import whom.
  {
    files: ['design/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [RELATIVE, LEGACY, { group: ['@/features/*', '@/data/*', '@/platform/*', '@/app/*'], message: 'The design system knows nothing about the product: no features, data or platform.' }],
      }],
    },
  },
  {
    files: ['features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [RELATIVE, LEGACY, { group: ['@/app/*'], message: 'Features do not import routes.' }, { group: ['@/design/*'], message: "Import UI from the '@/design' barrel." }],
      }],
    },
  },
  {
    files: ['platform/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [RELATIVE, LEGACY, { group: ['@/features/*', '@/design', '@/design/*', '@/app/*'], message: 'platform may import only data and shared.' }],
      }],
    },
  },
  {
    files: ['data/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [RELATIVE, LEGACY, { group: ['@/features/*', '@/platform/*', '@/design', '@/design/*', '@/app/*'], message: 'data may import only shared.' }],
      }],
    },
  },
  {
    files: ['shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [RELATIVE, LEGACY, { group: ['@/features/*', '@/platform/*', '@/data/*', '@/design', '@/design/*', '@/app/*'], message: 'shared depends on nothing else in the app.' }],
      }],
    },
  },
]);
