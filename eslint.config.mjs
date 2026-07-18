import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "apps/**",
    "scripts/**",
  ]),
  {
    rules: {
      // Turkish text has many apostrophes — too noisy to fix across codebase
      "react/no-unescaped-entities": "off",
      // Legacy <a> tags exist throughout — migration to Next.js Link is ongoing
      "@next/next/no-html-link-for-pages": "off",
      // memo/forwardRef throughout admin — display name is inferred by bundler
      "react/display-name": "off",

      // react-hooks v7 introduced react-compiler-style rules. These flag
      // common patterns (setState in effects, component creation in render, etc.)
      // that exist throughout the existing codebase. Disabled until codebase is
      // migrated to satisfy the react compiler constraints.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
]);

export default eslintConfig;
