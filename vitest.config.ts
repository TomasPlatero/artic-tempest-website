import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const srcPath = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": srcPath,
      "server-only": fileURLToPath(
        new URL("./vitest-mocks/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["node_modules", ".next", "dist", "e2e"],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://test-project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
      CRON_SECRET: "test-cron-secret",
    },
  },
});
