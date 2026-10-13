import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolves the "@/*" alias from tsconfig.json.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    // Integration tests need a real database; they are opted into separately.
    include: ["tests/unit/**/*.test.ts"],
  },
});
