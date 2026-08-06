import { sql } from "@/db";
import { requireApiPermission } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { requestContext } from "@/lib/request-context";
import { apiError, roleCreateSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiPermission(PERMISSIONS.ROLE_VIEW);
  if (auth.response) return auth.response;
  const [roles, permissions] = await Promise.all([
    sql`
      select r.id, r.code, r.name, r.description,
        r.is_system as "isSystem", r.is_active as "isActive",
        count(distinct ur.user_id)::int as "userCount",
        coalesce(array_agg(distinct rp.permission_id) filter (where rp.permission_id is not null), '{}') as "permissionIds"
      from roles r
      left join user_roles ur on ur.role_id = r.id
      left join role_permissions rp on rp.role_id = r.id
      group by r.id order by r.is_system desc, r.name
    `,
    sql`select id, code, name, description from permissions order by code`,
  ]);
  return Response.json({ roles, permissions });
}

export async function POST(request: Request) {
  const auth = await requireApiPermission(PERMISSIONS.ROLE_MANAGE);
  if (auth.response || !auth.user) return auth.response;
  try {
    const input = roleCreateSchema.parse(await request.json());
    const role = await sql.begin(async (transaction) => {
      const rows = await transaction`
        insert into roles (code, name, description)
        values (${input.code}, ${input.name}, ${input.description})
        returning id, code, name, description, is_system as "isSystem",
          is_active as "isActive"
      `;
      const created = rows[0] as Record<string, unknown>;
      for (const permissionId of input.permissionIds) {
        await transaction`
          insert into role_permissions (role_id, permission_id)
          values (${String(created.id)}, ${permissionId})
        `;
      }
      await writeAudit(transaction as unknown as typeof sql, {
        actor: auth.user,
        action: "CREATE",
        entityType: "Role",
        entityId: String(created.id),
        after: { ...created, permissionIds: input.permissionIds },
        context: requestContext(request),
      });
      return created;
    });
    return Response.json(role, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
