import { sql } from "@/db";
import { requireApiPermission } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { PERMISSIONS, ROLE_CODES } from "@/lib/permissions";
import { requestContext } from "@/lib/request-context";
import { isLastActiveManager, userHasManagerRole } from "@/lib/user-management";
import { apiError, userRolesSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, route: RouteContext) {
  const auth = await requireApiPermission(PERMISSIONS.USER_ASSIGN_ROLE);
  if (auth.response || !auth.user) return auth.response;
  const { id } = await route.params;
  try {
    const input = userRolesSchema.parse(await request.json());
    const managerRows = await sql<{ id: string }[]>`
      select id from roles where code = ${ROLE_CODES.MANAGER}
    `;
    const managerId = managerRows[0]?.id;
    const removesManager =
      managerId &&
      (await userHasManagerRole(id)) &&
      !input.roleIds.includes(managerId);
    if (removesManager && (await isLastActiveManager(id))) {
      return Response.json(
        { error: "Sistemde en az bir aktif yönetici kalmalıdır." },
        { status: 409 },
      );
    }
    await sql.begin(async (transaction) => {
      const userRows = await transaction`select id from users where id = ${id} for update`;
      if (!userRows[0]) throw new Error("Kullanıcı bulunamadı.");
      const validRoles = input.roleIds.length
        ? await transaction<{ id: string }[]>`
            select id from roles where id = any(${input.roleIds}) and is_active
          `
        : [];
      if (validRoles.length !== input.roleIds.length) {
        throw new Error("Seçilen rollerden biri bulunamadı veya pasif.");
      }
      const before = await transaction<{ roleId: string }[]>`
        select role_id as "roleId" from user_roles where user_id = ${id}
      `;
      await transaction`delete from user_roles where user_id = ${id}`;
      for (const roleId of input.roleIds) {
        await transaction`
          insert into user_roles (user_id, role_id, assigned_by_user_id)
          values (${id}, ${roleId}, ${auth.user.id})
        `;
      }
      await writeAudit(transaction as unknown as typeof sql, {
        actor: auth.user,
        action: "UPDATE",
        entityType: "UserRoles",
        entityId: id,
        before: { roleIds: before.map((item) => item.roleId) },
        after: { roleIds: input.roleIds },
        context: requestContext(request),
      });
    });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
