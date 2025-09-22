// import js from '@eslint/js';
// import angular from '@angular-eslint/eslint-plugin';
// import angularTemplate from '@angular-eslint/eslint-plugin-template';

const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      // Règles strictes pour un code propre
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-empty-function": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "quotes": ["error", "single"],
      "semi": ["error", "always"],
      "no-trailing-spaces": "error",
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  }
);