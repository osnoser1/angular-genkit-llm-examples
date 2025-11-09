// @ts-check
import { defineConfig } from 'eslint/config';
import oxlint from 'eslint-plugin-oxlint';
import { angularConfig } from '@repo/eslint-config/angular';

/** @type {import("eslint").Linter.Config[]} */

export default defineConfig(angularConfig, {
  files: ['**/*.{js,ts}'],
  extends: [...oxlint.buildFromOxlintConfigFile('./.oxlintrc.json')],
  rules: {
    '@typescript-eslint/no-unused-vars': 'off', // See https://github.com/oxc-project/eslint-plugin-oxlint/issues/466
  },
});
