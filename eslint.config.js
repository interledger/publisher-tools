import pluginJs from '@eslint/js'
import pluginImport from 'eslint-plugin-import'
import pluginReact from 'eslint-plugin-react'
import globals from 'globals'
import tseslint from 'typescript-eslint'

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
    files: ['frontend/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
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
      'import/order': [
        'error',
        {
          'groups': [
            'builtin', // node built-in modules
            'external', // npm packages
            'internal', // @/ and ~/ aliases
            ['parent', 'sibling', 'index'] // relative imports
          ],
          'pathGroups': [
            {
              pattern: 'react',
              group: 'external',
              position: 'before'
            },
            {
              pattern: 'react-router',
              group: 'external',
              position: 'before'
            },
            {
              pattern: '@interledger/**',
              group: 'external',
              position: 'after'
            },
            {
              pattern: '@/components{,/**}',
              group: 'internal',
              position: 'after'
            },
            {
              pattern: '@/**',
              group: 'internal'
            },
            {
              pattern: '~/**',
              group: 'internal'
            }
          ],
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
