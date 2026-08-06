import { sql } from "@/db";
import { requireApiPermission } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { requestContext } from "@/lib/request-context";
import { apiError, userUpdateSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, route: RouteContext) {
  const auth = await requireApiPermission(PERMISSIONS.USER_VIEW);
  if (auth.response) return auth.response;
  const { id } = await route.params;
  const rows = await sql`
    select u.id, u.username,
      coalesce(u.display_name, u.username) as "displayName",
      u.is_active as "isActive", u.must_change_password as "mustChangePassword",
      u.last_login_at as "lastLoginAt", u.created_at as "createdAt",
      coalesce(array_agg(r.id) filter (where r.id is not null), '{}') as "roleIds"
    from users u
    left join user_roles ur on ur.user_id = u.id
    left join roles r on r.id = ur.role_id
    where u.id = ${id}
    group by u.id
  `;
  if (!rows[0]) {
    return Response.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }
  return Response.json(rows[0]);
}

export async function PATCH(request: Request, route: RouteContext) {
  const auth = await requireApiPermission(PERMISSIONS.USER_UPDATE);
  if (auth.response || !auth.user) return auth.response;
  const { id } = await route.params;
  try {
    const input = userUpdateSchema.parse(await request.json());
    const updated = await sql.begin(async (transaction) => {
      const before = await transaction`
        select id, username, display_name as "displayName"
        from users where id = ${id} for update
      `;
      if (!before[0]) return null;
      const after = await transaction`
        update users set username = ${input.username},
          display_name = ${input.displayName}, updated_at = now()
        where id = ${id}
        returning id, username, display_name as "displayName"
      `;
      await writeAudit(transaction as unknown as typeof sql, {
        actor: auth.user,
        action: "UPDATE",
        entityType: "User",
        entityId: id,
        before: before[0] as Record<string, unknown>,
        after: after[0] as Record<string, unknown>,
        context: requestContext(request),
      });
      return after[0];
    });
    if (!updated) {
      return Response.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }
    return Response.json(updated);
  } catch (error) {
    return apiError(error);
  }
}
