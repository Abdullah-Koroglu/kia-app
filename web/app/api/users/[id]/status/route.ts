import { sql } from "@/db";
import { requireApiPermission } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { requestContext } from "@/lib/request-context";
import { isLastActiveManager, userHasManagerRole } from "@/lib/user-management";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, route: RouteContext) {
  const auth = await requireApiPermission(PERMISSIONS.USER_DISABLE);
  if (auth.response || !auth.user) return auth.response;
  const { id } = await route.params;
  const body = (await request.json().catch(() => null)) as { active?: boolean } | null;
  if (typeof body?.active !== "boolean") {
    return Response.json({ error: "Aktiflik değeri geçersiz." }, { status: 400 });
  }
  const active = body.active;
  if (!active && id === auth.user.id) {
    return Response.json({ error: "Kendi hesabınızı pasife alamazsınız." }, { status: 409 });
  }
  if (
    !active &&
    (await userHasManagerRole(id)) &&
    (await isLastActiveManager(id))
  ) {
    return Response.json(
      { error: "Sistemde en az bir aktif yönetici kalmalıdır." },
      { status: 409 },
    );
  }
  const updated = await sql.begin(async (transaction) => {
    await transaction`select pg_advisory_xact_lock(7241904)`;
    const before = await transaction<{ isActive: boolean }[]>`
      select is_active as "isActive" from users where id = ${id} for update
    `;
    if (!before[0]) return null;
    if (!active) {
      const managerAndOthers = await transaction<
        { isManager: boolean; otherManagers: number }[]
      >`
        select
          exists (
            select 1 from user_roles ur join roles r on r.id = ur.role_id
            where ur.user_id = ${id} and r.code = 'MANAGER' and r.is_active
          ) as "isManager",
          (
            select count(distinct u.id)::int from users u
            join user_roles ur on ur.user_id = u.id
            join roles r on r.id = ur.role_id
            where u.is_active and u.id <> ${id}
              and r.code = 'MANAGER' and r.is_active
          ) as "otherManagers"
      `;
      if (managerAndOthers[0]?.isManager && managerAndOthers[0].otherManagers === 0) {
        const error = new Error("Sistemde en az bir aktif yönetici kalmalıdır.");
        Object.assign(error, { code: "LAST_MANAGER" });
        throw error;
      }
    }
    const after = await transaction`
      update users set
        is_active = ${active},
        disabled_at = ${active ? null : new Date().toISOString()}::timestamptz,
        disabled_by_user_id = ${active ? null : auth.user.id},
        updated_at = now()
      where id = ${id}
      returning is_active as "isActive"
    `;
    if (!active) {
      await transaction`delete from sessions where user_id = ${id}`;
    }
    await writeAudit(transaction as unknown as typeof sql, {
      actor: auth.user,
      action: "UPDATE",
      entityType: "UserStatus",
      entityId: id,
      before: before[0],
      after: after[0] as Record<string, unknown>,
      context: requestContext(request),
    });
    return after[0];
  }).catch((error) => {
    if (typeof error === "object" && error && "code" in error && error.code === "LAST_MANAGER") {
      return { lastManagerError: true };
    }
    throw error;
  });
  if (updated && "lastManagerError" in updated) {
    return Response.json(
      { error: "Sistemde en az bir aktif yönetici kalmalıdır." },
      { status: 409 },
    );
  }
  if (!updated) {
    return Response.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }
  return Response.json(updated);
}
