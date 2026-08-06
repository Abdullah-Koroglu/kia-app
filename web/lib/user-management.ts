import "server-only";
import { sql } from "@/db";
import { ROLE_CODES } from "./permissions";

export async function isLastActiveManager(userId: string) {
  const rows = await sql<{ count: number }[]>`
    select count(distinct u.id)::int as count
    from users u
    join user_roles ur on ur.user_id = u.id
    join roles r on r.id = ur.role_id
    where u.is_active and r.is_active and r.code = ${ROLE_CODES.MANAGER}
      and u.id <> ${userId}
  `;
  return (rows[0]?.count ?? 0) === 0;
}

export async function userHasManagerRole(userId: string) {
  const rows = await sql`
    select 1
    from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.user_id = ${userId} and r.code = ${ROLE_CODES.MANAGER}
    limit 1
  `;
  return Boolean(rows[0]);
}
