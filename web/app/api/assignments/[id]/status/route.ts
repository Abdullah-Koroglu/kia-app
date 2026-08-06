import { sql } from "@/db";
import { requireApiPermission } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { requestContext } from "@/lib/request-context";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, route: RouteContext) {
  const { id } = await route.params;
  const body = (await request.json().catch(() => null)) as { action?: "CANCEL" | "COMPLETE" } | null;
  if (body?.action !== "CANCEL" && body?.action !== "COMPLETE") {
    return Response.json({ error: "Görev işlemi geçersiz." }, { status: 400 });
  }
  const permission = body.action === "CANCEL" ? PERMISSIONS.ASSIGNMENT_CANCEL : PERMISSIONS.ASSIGNMENT_COMPLETE;
  const auth = await requireApiPermission(permission);
  if (auth.response || !auth.user) return auth.response;
  const status = body.action === "CANCEL" ? "CANCELLED" : "COMPLETED";
  const rows = await sql`
    update research_assignments set status = ${status},
      cancelled_at = ${status === "CANCELLED" ? new Date().toISOString() : null}::timestamptz,
      cancelled_by_user_id = ${status === "CANCELLED" ? auth.user.id : null},
      completed_at = ${status === "COMPLETED" ? new Date().toISOString() : null}::timestamptz,
      completed_by_user_id = ${status === "COMPLETED" ? auth.user.id : null},
      updated_at = now()
    where id = ${id} and status = 'ACTIVE'
    returning id
  `;
  if (!rows[0]) return Response.json({ error: "Aktif görev bulunamadı." }, { status: 404 });
  await writeAudit(sql, {
    actor: auth.user, action: "UPDATE", entityType: "ResearchAssignment",
    entityId: id, after: { status }, context: requestContext(request),
  });
  return Response.json({ ok: true, status });
}
