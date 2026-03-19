import { config } from "dotenv";
import path from "path";
import { defineConfig } from "prisma/config";
import fs from "fs";

// For local CLI use: try root .env first, then apps/web/.env.local as fallback.
// In production (Vercel), DATABASE_URL is already in process.env — no file needed.
const rootEnv = path.resolve(__dirname, "../../../.env");
const webEnv = path.resolve(__dirname, "../../../apps/web/.env");

if (fs.existsSync(rootEnv)) {
  config({ path: rootEnv });
} else if (fs.existsSync(webEnv)) {
  config({ path: webEnv });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});