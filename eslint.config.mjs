import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import { includeIgnoreFile } from "@eslint/compat";
import pluginUnicorn from "eslint-plugin-unicorn";
import pluginJsdoc from "eslint-plugin-jsdoc";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import tslint from "typescript-eslint";

import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

export default defineConfig(
  // define specific ignore patterns
  globalIgnores([
    "*.d.ts",
    // prevent lint for generated files
    "CHANGELOG.md",
  ]),

  // include .gitignore ignore patterns
  includeIgnoreFile(gitignorePath),

  // add js configs
  eslint.configs.recommended,

  // add ts configs
  tslint.configs.recommendedTypeChecked,
  // add TS parserOptions to tell how to find the TSConfig for each source file
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.mjs", "*.config.ts"],
        },
      },
    },
  },

  // add unicon configs
  pluginUnicorn.configs.recommended,

  // add jsdoc configs
  pluginJsdoc.configs["flat/recommended-typescript-error"],
  pluginJsdoc.configs["flat/logical-typescript-error"],
  pluginJsdoc.configs["flat/stylistic-typescript-error"],

  // add prettier lint configs
  // deactivate rules that conflict or are unnecessary with Prettier
  eslintConfigPrettier,

  // project specific modifications
  {
    name: "overrides",
    rules: {
      // TypeScript
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/unbound-method": "off",
      // JSDoc
      "jsdoc/require-hyphen-before-param-description": ["error", "always"],
      // Unicorn
      "unicorn/filename-case": "off",
      "unicorn/no-array-for-each": "off",
      "unicorn/no-array-reduce": "off",
      "unicorn/prevent-abbreviations": "off",
    },
  },
);
