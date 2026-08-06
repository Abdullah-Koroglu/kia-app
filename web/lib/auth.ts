import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "@/db";

export const SESSION_COOKIE = "qiraat_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  roles: string[];
  permissions: string[];
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await sql`
    insert into sessions (user_id, token_hash, expires_at)
    values (${userId}, ${tokenHash}, ${expiresAt.toISOString()}::timestamptz)
  `;

  return { token, expiresAt };
}

export async function deleteSession(token: string | undefined) {
  if (!token) return;
  await sql`delete from sessions where token_hash = ${hashToken(token)}`;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await sql<
    { id: string; username: string; displayName: string; roles: string[]; permissions: string[] }[]
  >`
    select
      u.id,
      u.username,
      coalesce(u.display_name, u.username) as "displayName",
      coalesce(array_agg(distinct r.code) filter (where r.code is not null), '{}') as roles,
      coalesce(array_agg(distinct p.code) filter (where p.code is not null), '{}') as permissions
    from sessions s
    join users u on u.id = s.user_id
    left join user_roles ur on ur.user_id = u.id
    left join roles r on r.id = ur.role_id and r.is_active
    left join role_permissions rp on rp.role_id = r.id
    left join permissions p on p.id = rp.permission_id
    where s.token_hash = ${hashToken(token)}
      and s.expires_at > now()
      and u.is_active
    group by u.id, u.username, u.display_name
    limit 1
  `;

  if (!rows[0]) return null;
  return {
    ...rows[0],
    roles: rows[0].roles ?? [],
    permissions: rows[0].permissions ?? [],
  };
}

export async function requireUser(returnTo = "/persons") {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  return user;
}

export async function cleanupExpiredSessions() {
  await sql`delete from sessions where expires_at <= now()`;
}
