import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores(
    [
      ".next/**",
      "build/**",
      "gen/**",
      "next-env.d.ts",
      "node_modules/**",
      "out/**",
    ],
    "Project build artifacts and generated clients are not lint sources.",
  ),
]);

export default eslintConfig;
