import pluginImport from 'eslint-plugin-import'
import pluginReact from 'eslint-plugin-react'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginJs from '@eslint/js'

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    }
  },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,d.ts}'],
    ...pluginReact.configs.flat.recommended,
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    plugins: {
      import: pluginImport
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'import/no-unresolved': 'off',
      'import/extensions': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      'import/export': 'error', // forbid invalid exports and re-exports of the same name
      'import/no-duplicates': 'error', // forbid duplicate imports
      'import/order': [
        'error',
        {
          'groups': [
            'builtin', // node built-in modules
            'external', // npm packages
            'internal', // @shared/**, @tools/**, @/** and ~/** aliases
            ['parent', 'sibling', 'index'], // relative imports
            'type'
          ],
          'pathGroups': [
            {
              pattern: 'react**',
              group: 'external',
              position: 'before'
            },
            {
              pattern: '@!(shared|tools)/**', // exclude workspace packages from external @**
              group: 'external',
              position: 'after'
            },
            {
              pattern: '@shared/**',
              group: 'internal',
              position: 'before'
            },
            {
              pattern: '@tools/**',
              group: 'internal',
              position: 'before'
            },
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after'
            },
            {
              pattern: '~/**',
              group: 'internal',
              position: 'after'
            }
          ],
          'pathGroupsExcludedImportTypes': ['builtin', 'type'],
          'newlines-between': 'never',
          'alphabetize': {
            order: 'asc',
            caseInsensitive: true
          }
        }
      ]
    }
  },
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/build/',
      '**/public/init.js',
      '**/.react-router/',
      '**/.wrangler/'
    ]
  }
]
