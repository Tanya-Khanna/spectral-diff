import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Project-specific rule overrides
  {
    rules: {
      // Allow any in catch blocks and API responses (common pattern)
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow require for dynamic imports with guards
      "@typescript-eslint/no-require-imports": "off",
      // Allow unused vars with underscore prefix
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Allow setState in effects for initialization patterns
      "react-hooks/set-state-in-effect": "off",
      // Allow img elements (we're not optimizing images in this project)
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
