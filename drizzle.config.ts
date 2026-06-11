import { defineConfig } from "drizzle-kit";

// NOTE: Supabase exposes two ports:
//   - 6543 = transaction pooler (used by the app at runtime, see .env / db/index.ts)
//   - 5432 = session mode (required by drizzle-kit for pull/generate/migrate/push)
// If a drizzle-kit command hangs, run it against the 5432 session port, e.g.:
//   DATABASE_URL='postgresql://...@...pooler.supabase.com:5432/postgres' bun run db:pull
export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
