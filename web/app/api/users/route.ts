import { sql } from "@/db";
import { requireApiPermission } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/password";
import { PERMISSIONS } from "@/lib/permissions";
import { requestContext } from "@/lib/request-context";
import { apiError, userCreateSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiPermission(PERMISSIONS.USER_VIEW);
  if (auth.response) return auth.response;

  const users = await sql`
    select
      u.id,
      u.username,
      coalesce(u.display_name, u.username) as "displayName",
      u.is_active as "isActive",
      u.must_change_password as "mustChangePassword",
      u.last_login_at as "lastLoginAt",
      u.created_at as "createdAt",
      coalesce(
        jsonb_agg(
          distinct jsonb_build_object('id', r.id, 'code', r.code, 'name', r.name)
        ) filter (where r.id is not null),
        '[]'::jsonb
      ) as roles
    from users u
    left join user_roles ur on ur.user_id = u.id
    left join roles r on r.id = ur.role_id
    group by u.id
    order by u.is_active desc, coalesce(u.display_name, u.username), u.username
  `;
  return Response.json({ items: users });
}

export async function POST(request: Request) {
  const auth = await requireApiPermission(PERMISSIONS.USER_CREATE);
  if (auth.response || !auth.user) return auth.response;

  try {
    const input = userCreateSchema.parse(await request.json());
    const passwordHash = await hashPassword(input.password);
    const context = requestContext(request);
    const created = await sql.begin(async (transaction) => {
      const roles = await transaction<{ id: string }[]>`
        select id from roles
        where id = any(${input.roleIds}) and is_active
      `;
      if (roles.length !== input.roleIds.length) {
        throw new Error("Seçilen rollerden biri bulunamadı veya pasif.");
      }
      const rows = await transaction`
        insert into users (
          username, display_name, password_hash, must_change_password,
          created_by_user_id
        ) values (
          ${input.username}, ${input.displayName}, ${passwordHash},
          ${input.mustChangePassword}, ${auth.user.id}
        )
        returning id, username, display_name as "displayName",
          is_active as "isActive", must_change_password as "mustChangePassword"
      `;
      const user = rows[0] as Record<string, unknown>;
      for (const roleId of input.roleIds) {
        await transaction`
          insert into user_roles (user_id, role_id, assigned_by_user_id)
          values (${String(user.id)}, ${roleId}, ${auth.user.id})
        `;
      }
      await writeAudit(transaction as unknown as typeof sql, {
        actor: auth.user,
        action: "CREATE",
        entityType: "User",
        entityId: String(user.id),
        after: { ...user, roleIds: input.roleIds },
        context,
      });
      return user;
    });
    return Response.json(created, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
