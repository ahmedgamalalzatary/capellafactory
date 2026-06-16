import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const alias = {
  "@": fileURLToPath(new URL("./src", import.meta.url)),
};

export default defineConfig({
  test: {
    // `include` surfaces untested components as real 0% instead of hiding them
    // (v8 otherwise only reports files a test imports). `exclude` drops code we
    // don't own/maintain as logic: vendored shadcn UI primitives and Next.js
    // route boilerplate (server-rendered pages, layouts, error/loading shells).
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/components/ui/**",
        "src/app/**/{page,layout,error,loading,not-found,template}.tsx",
      ],
    },
    projects: [
      {
        resolve: { alias },
        test: {
          name: "node",
          environment: "node",
          include: ["tests/**/*.test.ts"],
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["tests/**/*.dom.test.tsx"],
          setupFiles: ["tests/setup.dom.ts"],
        },
      },
    ],
  },
});
