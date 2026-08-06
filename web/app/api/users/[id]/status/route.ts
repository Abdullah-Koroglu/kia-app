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
    const before = await transaction<{ isActive: boolean }[]>`
      select is_active as "isActive" from users where id = ${id} for update
    `;
    if (!before[0]) return null;
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
  });
  if (!updated) {
    return Response.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }
  return Response.json(updated);
}
