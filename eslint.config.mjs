import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { globals: globals.node }
  },
  {
    files: ["**/*.ts"],
    languageOptions: { globals: globals.node },
    rules: { "@typescript-eslint/no-explicit-any": "error" }
  }
);
