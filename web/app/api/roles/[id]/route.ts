import { sql } from "@/db";
import { requireApiPermission } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { ROLE_CODES } from "@/lib/permissions";
import { requestContext } from "@/lib/request-context";
import { apiError, roleUpdateSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, route: RouteContext) {
  const auth = await requireApiPermission(PERMISSIONS.ROLE_MANAGE);
  if (auth.response || !auth.user) return auth.response;
  const { id } = await route.params;
  try {
    const input = roleUpdateSchema.parse(await request.json());
    const protectedRole = await sql<{ code: string; isSystem: boolean }[]>`
      select code, is_system as "isSystem" from roles where id = ${id}
    `;
    if (!protectedRole[0]) {
      return Response.json({ error: "Rol bulunamadı." }, { status: 404 });
    }
    if (protectedRole[0].isSystem && !input.isActive) {
      return Response.json(
        { error: "Sistem rolleri pasife alınamaz." },
        { status: 409 },
      );
    }
    if (protectedRole[0].code === ROLE_CODES.MANAGER) {
      const required = await sql<{ id: string }[]>`
        select id from permissions where code not in (
          ${PERMISSIONS.REVIEW_QUEUE_VIEW}, ${PERMISSIONS.PERSON_APPROVE},
          ${PERMISSIONS.PERSON_REQUEST_CHANGES},
          ${PERMISSIONS.PERSON_REVIEW_COMMENT},
          ${PERMISSIONS.PERSON_APPROVAL_REVOKE}
        )
      `;
      if (required.some((permission) => !input.permissionIds.includes(permission.id))) {
        return Response.json(
          { error: "Yönetici rolünün kontrol kararları dışındaki yetkileri kaldırılamaz." },
          { status: 409 },
        );
      }
    }
    const updated = await sql.begin(async (transaction) => {
      const beforeRows = await transaction`
        select id, code, name, description, is_system as "isSystem",
          is_active as "isActive"
        from roles where id = ${id} for update
      `;
      if (!beforeRows[0]) return null;
      const afterRows = await transaction`
        update roles set name = ${input.name}, description = ${input.description},
          is_active = ${input.isActive}, updated_at = now()
        where id = ${id}
        returning id, code, name, description, is_system as "isSystem",
          is_active as "isActive"
      `;
      await transaction`delete from role_permissions where role_id = ${id}`;
      for (const permissionId of input.permissionIds) {
        await transaction`
          insert into role_permissions (role_id, permission_id)
          values (${id}, ${permissionId})
        `;
      }
      await writeAudit(transaction as unknown as typeof sql, {
        actor: auth.user,
        action: "UPDATE",
        entityType: "Role",
        entityId: id,
        before: beforeRows[0] as Record<string, unknown>,
        after: {
          ...(afterRows[0] as Record<string, unknown>),
          permissionIds: input.permissionIds,
        },
        context: requestContext(request),
      });
      return afterRows[0];
    });
    if (!updated) {
      return Response.json({ error: "Rol bulunamadı." }, { status: 404 });
    }
    return Response.json(updated);
  } catch (error) {
    return apiError(error);
  }
}
