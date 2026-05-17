module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:vue/strongly-recommended', '@vue/prettier', 'plugin:vue-i18n/recommended'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-var': 'error',
    'prettier/prettier': 'error',
    'vue-i18n/no-raw-text': [
      'error',
      {
        ignoreNodes: ['v-icon'],
        ignoreText: ['', ':', '%', '<', '>', '(', ')', '—', '/', '»', '«'],
      },
    ],
    // Values below are valid issues that are being ignored
    'vue/no-mutating-props': 'off',
    'vue/valid-v-slot': [
      'error',
      {
        allowModifiers: true,
      },
    ],
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
  settings: {
    'vue-i18n': {
      // only check for missing keys from the base english translation
      localeDir: './src/locales/en.json',
    },
  },
}
