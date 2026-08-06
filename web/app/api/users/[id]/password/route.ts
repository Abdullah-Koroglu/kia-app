import { sql } from "@/db";
import { requireApiPermission } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/password";
import { PERMISSIONS } from "@/lib/permissions";
import { requestContext } from "@/lib/request-context";
import { apiError, passwordResetSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, route: RouteContext) {
  const auth = await requireApiPermission(PERMISSIONS.USER_RESET_PASSWORD);
  if (auth.response || !auth.user) return auth.response;
  const { id } = await route.params;
  try {
    const input = passwordResetSchema.parse(await request.json());
    const passwordHash = await hashPassword(input.password);
    const rows = await sql`
      update users set password_hash = ${passwordHash},
        must_change_password = ${input.mustChangePassword}, updated_at = now()
      where id = ${id}
      returning id
    `;
    if (!rows[0]) {
      return Response.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }
    await sql`delete from sessions where user_id = ${id}`;
    await writeAudit(sql, {
      actor: auth.user,
      action: "UPDATE",
      entityType: "UserPassword",
      entityId: id,
      metadata: { mustChangePassword: input.mustChangePassword },
      context: requestContext(request),
    });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
