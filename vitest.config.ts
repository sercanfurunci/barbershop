import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: { lines: 60, functions: 60, branches: 50, statements: 60 },
      exclude: [
        "node_modules",
        ".next",
        "tests",
        "prisma",
        "*.config.*",
        "**/*.config.*",
      ],
    },
  },
  resolve: {
    alias: { "@": resolve(__dirname, "./") },
  },
});
