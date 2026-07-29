import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
};

function createClient() {
  // Next.js route modüllerini build sırasında değerlendirir. postgres-js
  // bağlantıyı ilk sorguya kadar açmadığı için build aşamasında zararsız bir
  // yer tutucu kullanılır; çalışan ortamda DATABASE_URL zorunludur.
  const url =
    process.env.DATABASE_URL ??
    "postgresql://build:build@127.0.0.1:9/database_url_required";

  return postgres(url, {
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
}

export const sql = globalForDb.sql ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.sql = sql;
}

export const db = drizzle(sql, { schema });

export type SqlClient = typeof sql;
