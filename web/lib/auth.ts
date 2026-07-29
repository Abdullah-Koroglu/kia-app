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

  const rows = await sql<AuthUser[]>`
    select u.id, u.username
    from sessions s
    join users u on u.id = s.user_id
    where s.token_hash = ${hashToken(token)}
      and s.expires_at > now()
    limit 1
  `;

  if (!rows[0]) return null;
  return rows[0];
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
