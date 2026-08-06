import "dotenv/config";
import postgres from "postgres";
import { hashPassword } from "../lib/password";
import { writeAudit } from "../lib/audit";
import { ROLE_CODES } from "../lib/permissions";

const [usernameArg, passwordArg, roleArg] = process.argv.slice(2);
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
    insert into users (username, password_hash, display_name, is_active)
    values (${username}, ${passwordHash}, ${username}, true)
    on conflict (username)
    do update set
      password_hash = excluded.password_hash,
      is_active = true,
      updated_at = now()
    returning id, username
  `;

  const roleCode = roleArg?.trim().toUpperCase() || ROLE_CODES.MANAGER;
  const matchingRoles = await client<{ id: string }[]>`
    select id from roles where code = ${roleCode} and is_active
  `;
  if (!matchingRoles[0]) {
    throw new Error(`Aktif rol bulunamadı: ${roleCode}`);
  }
  await client`
    insert into user_roles (user_id, role_id)
    values (${rows[0].id}, ${matchingRoles[0].id})
    on conflict (user_id, role_id) do nothing
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
