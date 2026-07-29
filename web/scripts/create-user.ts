import "dotenv/config";
import postgres from "postgres";
import { hashPassword } from "../lib/password";
import { writeAudit } from "../lib/audit";

const [usernameArg, passwordArg] = process.argv.slice(2);
const username = usernameArg?.trim() || process.env.SEED_USERNAME?.trim();
const password = passwordArg || process.env.SEED_PASSWORD;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || !username || !password) {
  throw new Error(
    "Kullanım: npm run user:create -- <kullanıcı-adı> <şifre> veya SEED_USERNAME/SEED_PASSWORD tanımlayın.",
  );
}

const client = postgres(databaseUrl, { max: 1 });
try {
  const passwordHash = await hashPassword(password);
  const rows = await client<{ id: string; username: string }[]>`
    insert into users (username, password_hash)
    values (${username}, ${passwordHash})
    on conflict (username)
    do update set password_hash = excluded.password_hash, updated_at = now()
    returning id, username
  `;

  await writeAudit(client, {
    actorUsername: "system",
    actorType: "SYSTEM",
    action: "SEED",
    entityType: "User",
    entityId: rows[0].id,
    source: "SEED",
    after: rows[0],
  });

  console.log(`Kullanıcı hazır: ${rows[0].username}`);
} finally {
  await client.end();
}

