import globals from "globals";
import pluginJs from "@eslint/js";
import stylisticJs from '@stylistic/eslint-plugin-js';
import eslintPluginJest from 'eslint-plugin-jest';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['dist/**'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest
      },
    },
    plugins: {
      '@stylistic/js': stylisticJs,
      'jest': eslintPluginJest
    },
    rules:{
      "@stylistic/js/indent": ["error", 2],
      "semi": "error",
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
    }
  },
  pluginJs.configs.recommended,
];