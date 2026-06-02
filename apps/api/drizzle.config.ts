import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// Load the repo-root .env (drizzle-kit runs from apps/api and doesn't load it otherwise).
// Guard against its absence so CI/Docker environments without a repo-root .env don't crash.
const rootEnvUrl = new URL("../../.env", import.meta.url);
if (existsSync(rootEnvUrl)) {
  process.loadEnvFile(rootEnvUrl);
}

const password = process.env.DB_PASSWORD;

export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    database: process.env.DB_NAME ?? "capella",
    ...(password ? { password } : {}),
  },
});
