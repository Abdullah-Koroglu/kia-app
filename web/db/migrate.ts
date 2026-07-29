import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL tanımlı değil.");
}

const client = postgres(databaseUrl, { max: 1 });

try {
  await client`create extension if not exists unaccent`;
  await client`create extension if not exists pg_trgm`;
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.log("Migration tamamlandı.");
} finally {
  await client.end();
}

