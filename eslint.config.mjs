// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import pluginImport from 'eslint-plugin-import';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      import: pluginImport,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // 1. Node.js built-ins
            ['^node:', `^(${require('module').builtinModules.join('|')})(/|$)`],

            // 2. External packages
            ['^@?\\w'],

            // 3. Internal packages (e.g. @app/* or src/* aliases)
            ['^(@app|src|@/)(/.*|$)'],

            // 4. Parent imports
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],

            // 5. Sibling imports
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],

            // 6. Style imports
            ['^.+\\.s?css$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      'import/no-duplicates': 'error',
    },
  },
);
