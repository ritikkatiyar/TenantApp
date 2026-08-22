// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['**/src/theme/Theme.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Property[key.name=/^(color|backgroundColor|borderColor|shadowColor)$/] > Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
          message: 'Do not use hardcoded hex colors. Use theme colors from useAppTheme() instead.',
        },
        {
          selector: 'Property[key.value=/^(color|backgroundColor|borderColor|shadowColor)$/] > Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
          message: 'Do not use hardcoded hex colors. Use theme colors from useAppTheme() instead.',
        },
        {
          selector: 'Property[key.name="fontSize"] > Literal',
          message: 'Do not use hardcoded font sizes. Use theme typography tokens from useAppTheme() instead.',
        },
        {
          selector: 'Property[key.value="fontSize"] > Literal',
          message: 'Do not use hardcoded font sizes. Use theme typography tokens from useAppTheme() instead.',
        },
      ],
    },
  },
]);
